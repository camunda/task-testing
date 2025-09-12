import React, { useRef, useEffect, useState } from 'react';

import { Button } from '@carbon/react';
import { Copy } from '@carbon/icons-react';

import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
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
        theme,
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
    <Button
      className="code__editor-copy-button"
      renderIcon={ Copy }
      iconDescription="Copy to clipboard"
      size="sm"
      kind="ghost"
      hasIconOnly
      tooltipPosition="left"
      onClick={ () => {
        navigator.clipboard.writeText(value);
      } } />
    <div className="code__editor-codemirror">
      <div ref={ ref } className="code__editor-codemirror-inner"></div>
    </div>
  </div>;
}