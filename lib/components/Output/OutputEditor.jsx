/**
 * @import {
 *   Element
 * } from 'bpmn-js/lib/model/Types';
 */

import React, { useRef, useEffect, useState } from 'react';

import { Button } from '@carbon/react';
import { Copy, Checkmark } from '@carbon/icons-react';

import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { EditorView, Decoration, keymap } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import { foldGutter, foldKeymap } from '@codemirror/language';
import theme from '../shared/CodeMirrorTheme';

import ResultActionMenu from './ResultActionMenu';
import { resolveJsonNode } from '../../utils/jsonPath';

// --- Hover highlight extension (module scope, created once) ---

/** @type {import('@codemirror/state').StateEffectType<{from: number, to: number} | null>} */
const setHoverHighlight = StateEffect.define();

const hoverMark = Decoration.mark({ class: 'output__hover-highlight' });

const hoverHighlightField = StateField.define({
  create: () => Decoration.none,
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHoverHighlight)) {
        if (effect.value === null) return Decoration.none;
        const { from, to } = effect.value;
        return Decoration.set([ hoverMark.range(from, to) ]);
      }
    }
    return tr.docChanged ? Decoration.none : decorations;
  },
  provide: (field) => EditorView.decorations.from(field)
});

// --------------------------------------------------------------

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {Element} [props.element] - the currently selected element, required
 *   for the delegated result actions
 * @param {Object} [props.variables] - full result variables for FEEL Playground context
 * @param {(element: Element, sourceFeelExpression: string, targetName: string) => void} [props.onAppendOutputMapping]
 * @param {(element: Element, targetName: string) => void} [props.onNavigateToOutputMapping]
 */
export default function OutputEditor({ value, element, variables, onAppendOutputMapping, onNavigateToOutputMapping }) {

  const ref = useRef(null);

  /**
   * @type {ReturnType<typeof useState<EditorView>>}
   */
  const [ editorView, setEditorView ] = useState();

  /**
   * Action menu state.
   *
   * @type {ReturnType<typeof useState<{ x: number, y: number, path: string, value: any, key: string }>>}
   */
  const [ menu, setMenu ] = useState();

  /** True briefly after a copy action fires — swaps the copy button icon to a checkmark. */
  const [ copiedState, setCopiedState ] = useState(false);

  /** @type {React.MutableRefObject<import('../../utils/jsonPath').ResolvedJsonNode|null>} */
  const hoverNodeRef = useRef(null);

  /** True while the Carbon Menu is mounted and open. */
  const menuOpenRef = useRef(false);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const editorState = EditorState.create({
      doc: value,
      extensions: [
        json(),
        EditorState.tabSize.of(2),
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        foldGutter(),
        keymap.of(foldKeymap),
        hoverHighlightField,
        theme
      ]
    });

    const view = new EditorView({
      state: editorState,
      parent: ref.current,
    });

    function clearHover() {
      hoverNodeRef.current = null;
      view.dispatch({ effects: setHoverHighlight.of(null) });
    }

    function onMouseMove(event) {
      if (menuOpenRef.current) return;
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
      if (pos === null) { clearHover(); return; }
      const resolved = resolveJsonNode(view.state, { from: pos, to: pos });
      if (!resolved) { clearHover(); return; }
      const current = hoverNodeRef.current;
      if (current?.nodeFrom === resolved.nodeFrom && current?.nodeTo === resolved.nodeTo) return;
      hoverNodeRef.current = resolved;
      view.dispatch({ effects: setHoverHighlight.of({ from: resolved.nodeFrom, to: resolved.nodeTo }) });
    }

    function onMouseLeave() {
      clearHover();
    }

    // TODO: add keyboard trigger (e.g. Enter/Space) for accessibility
    function onClick(event) {
      const resolved = hoverNodeRef.current;
      if (!resolved) return;
      menuOpenRef.current = true;
      setMenu({ x: event.clientX, y: event.clientY, path: resolved.path, value: resolved.value, key: resolved.key });
    }

    view.dom.addEventListener('mousemove', onMouseMove);
    view.dom.addEventListener('mouseleave', onMouseLeave);
    view.dom.addEventListener('click', onClick);

    setEditorView(view);

    return () => {
      view.dom.removeEventListener('mousemove', onMouseMove);
      view.dom.removeEventListener('mouseleave', onMouseLeave);
      view.dom.removeEventListener('click', onClick);
      view.destroy();
    };
  }, []);

  useEffect(() => {
    if (!editorView) return;

    const editorValue = editorView.state.doc.toString();

    if (value !== editorValue) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorValue.length,
          insert: value
        }
      });
    }
  }, [ editorView, value ]);

  return <div className="code__editor">
    <div className="code__editor-buttons">
      <Button
        renderIcon={ copiedState ? Checkmark : Copy }
        iconDescription={ copiedState ? 'Copied!' : 'Copy to clipboard' }
        size="sm"
        kind="ghost"
        hasIconOnly
        tooltipPosition="left"
        onClick={ () => {
          navigator.clipboard.writeText(value);
          setCopiedState(true);
          setTimeout(() => setCopiedState(false), 1500);
        } } />
    </div>
    <div className="code__editor-codemirror">
      <div ref={ ref } className="code__editor-codemirror-inner"></div>
    </div>
    { menu && element && (
      <ResultActionMenu
        open
        x={ menu.x }
        y={ menu.y }
        path={ menu.path }
        value={ menu.value }
        propKey={ menu.key }
        variables={ variables }
        element={ element }
        onClose={ () => { menuOpenRef.current = false; setMenu(undefined); } }
        onCopy={ () => { setCopiedState(true); setTimeout(() => setCopiedState(false), 1500); } }
        onAppendOutputMapping={ onAppendOutputMapping }
        onNavigateToOutputMapping={ onNavigateToOutputMapping }
      />
    ) }
  </div>;
}
