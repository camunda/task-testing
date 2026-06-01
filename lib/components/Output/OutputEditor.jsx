/**
 * @import {
 *   Element
 * } from 'bpmn-js/lib/model/Types';
 */

import React, { useRef, useEffect, useState } from 'react';

import { Button } from '@carbon/react';
import { Copy } from '@carbon/icons-react';

import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import { foldGutter, foldKeymap } from '@codemirror/language';
import theme from '../shared/CodeMirrorTheme';

import ResultActionMenu from './ResultActionMenu';
import { resolveJsonNode } from '../../utils/jsonPath';

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {Element} [props.element] - the currently selected element, required
 *   for the delegated result actions
 * @param {(element: Element, path: string, value: *) => void} [props.onAddToExampleData]
 * @param {(element: Element, sourceFeelExpression: string, targetName: string) => void} [props.onAppendOutputMapping]
 */
export default function OutputEditor({ value, element, onAddToExampleData, onAppendOutputMapping }) {

  const ref = useRef(null);

  /**
   * @type {ReturnType<typeof useState<EditorView>>}
   */
  const [ editorView, setEditorView ] = useState();

  /**
   * Action menu state derived from the current selection.
   *
   * @type {ReturnType<typeof useState<{ x: number, y: number, path: string, value: any }>>}
   */
  const [ menu, setMenu ] = useState();

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.selectionSet && !update.docChanged) {
        return;
      }

      setMenu(getMenuState(update.view));
    });

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
        updateListener,
        theme
      ]
    });

    const view = new EditorView({
      state: editorState,
      parent: ref.current,
    });

    setEditorView(view);

    return () => {
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
        renderIcon={ Copy }
        iconDescription="Copy to clipboard"
        size="sm"
        kind="ghost"
        hasIconOnly
        tooltipPosition="left"
        onClick={ () => {
          navigator.clipboard.writeText(value);
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
        element={ element }
        onClose={ () => setMenu(undefined) }
        onAddToExampleData={ onAddToExampleData }
        onAppendOutputMapping={ onAppendOutputMapping }
      />
    ) }
  </div>;
}

/**
 * Derive the action menu state from the current editor selection. Returns
 * `null` when the selection is empty or cannot be resolved to a JSON node.
 *
 * @param {EditorView} view
 * @returns {{ x: number, y: number, path: string, value: any }|undefined}
 */
function getMenuState(view) {
  const { from, to, head } = view.state.selection.main;

  if (from === to) {
    return undefined;
  }

  const resolved = resolveJsonNode(view.state, { from, to });

  if (!resolved) {
    return undefined;
  }

  const coords = view.coordsAtPos(head);

  if (!coords) {
    return undefined;
  }

  return {
    x: coords.left,
    y: coords.bottom,
    path: resolved.path,
    value: resolved.value
  };
}
