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
  variables = []
}) {

  const editorRef = useRef(null);
  const viewRef = useRef(null);

  const jsonLinter = () => {
    return () => {
      return (view) => {
        const errors = jsonParseLinter()(view);
        onErrorChange(!!errors.length);
        return errors;
      };
    };
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        json(),
        linter(jsonLinter(onErrorChange)()),
        ...getAutocompletionExtensions(variables),
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
  }, [ variables ]);

  return <div ref={ editorRef } className="input-editor" />;
}

