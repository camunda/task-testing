import React, { useEffect, useRef } from 'react';

import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView, placeholder } from '@codemirror/view';
import { linter } from '@codemirror/lint';
import { json, jsonParseLinter } from '@codemirror/lang-json';

import './style.scss';

export default function CodeEditor({
  value = '{\n}',
  readOnly = false,
  linting = true,
  placeholder: placeholderText,
  onChange = () => {},
  onErrorChange = () => {},
}) {

  const editorRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        json(),
        linting ? linter(jsonLinter()) : [],
        placeholderText ? placeholder(placeholderText) : [],
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorState.readOnly.of(readOnly)
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  useEffect(() => {
    if (!viewRef.current) {
      return;
    }

    const currentDoc = viewRef.current.state.doc.toString();
    if (currentDoc === value) {
      return;
    }

    viewRef.current.dispatch({
      changes: {
        from: 0,
        to: currentDoc.length,
        insert: value
      }
    });

    // Scroll to the bottom
    const docLength = viewRef.current.state.doc.length;
    viewRef.current.dispatch({
      effects: EditorView.scrollIntoView(docLength, { y: 'end' })
    });
  }, [ value ]);

  const jsonLinter = () => {
    return (view) => {
      const errors = jsonParseLinter()(view);
      onErrorChange(!!errors.length);
      return errors;
    };
  };

  return <div ref={ editorRef } className="code-editor_container" />;
}