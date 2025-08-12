import React, { useEffect, useRef } from 'react';

import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView, placeholder } from '@codemirror/view';
import { linter } from '@codemirror/lint';
import { json, jsonParseLinter } from '@codemirror/lang-json';

import { getAutocompletionExtensions } from '../../utils/autocompletion';

export default function InputEditor({
  value,
  onChange,
  onErrorChange,
  autocompletion = []
}) {

  const editorRef = useRef(null);
  const viewRef = useRef(null);

  const jsonLinter = (view) => {
    const errors = jsonParseLinter()(view);
    onErrorChange(!!errors.length);

    if (errors && errors.length > 0) {
      const errorMessage = errors[0].message || 'Error';
      editorRef.current?.style.setProperty('--error-message', `"${errorMessage}"`);
    } else {
      editorRef.current?.style.removeProperty('--error-message');
    }

    return errors;
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        json(),
        linter(jsonLinter, { delay: 100 }),
        ...getAutocompletionExtensions(autocompletion),
        placeholder('Provide process variables in JSON format'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newText = update.state.doc.toString();
            onChange(newText);
          }
        }),
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
  }, [ autocompletion ]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) return;

    const currentValue = view.state.doc.toString();

    if (value !== currentValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value
        }
      });
    }
  }, [value]);

  return <div ref={ editorRef } className="input-editor" />;
}

