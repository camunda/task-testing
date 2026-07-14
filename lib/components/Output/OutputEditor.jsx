import React, { useRef, useEffect, useState } from 'react';

import { Button } from '@camunda/design-system';
import { Copy } from 'lucide-react';

import Tooltip from '../shared/Tooltip';

import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import { foldGutter, foldKeymap } from '@codemirror/language';
import theme from '../shared/CodeMirrorTheme';

export default function OutputEditor({ value }) {

  const ref = useRef(null);

  /**
   * @type {ReturnType<typeof useState<EditorView>>}
   */
  const [ editorView, setEditorView ] = useState();

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
      <Tooltip label="Copy to clipboard" align="bottom-end">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copy to clipboard"
          onClick={ () => {
            navigator.clipboard.writeText(value);
          } }>
          <Copy aria-hidden="true" />
        </Button>
      </Tooltip>
    </div>
    <div className="code__editor-codemirror">
      <div ref={ ref } className="code__editor-codemirror-inner"></div>
    </div>
  </div>;
}