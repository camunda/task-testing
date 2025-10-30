import React, { useEffect, useRef, useState } from 'react';

import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { defaultKeymap } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { Compartment, EditorState, Annotation } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { linter } from '@codemirror/lint';
import { json, jsonParseLinter } from '@codemirror/lang-json';

import classNames from 'classnames';

import theme from '../shared/CodeMirrorTheme';

import { getAutocompletionExtensions } from '../../utils/autocompletion';

const fromPropAnnotation = Annotation.define();

const autocompletionCompartment = new Compartment();

export const PLACEHOLDER_TEXT = 'Enter process variables in JSON format';

export const INVALID_JSON_ERROR = 'JSON contains errors';

/**
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {import('../../types').Variables} props.variables
 * @param {function(string): void} props.onChange
 * @param {function(string?): void} props.onErrorChange
 * @returns
 */
export default function InputEditor({
  value,
  variables,
  onChange,
  onErrorChange
}) {

  const ref = useRef(null);

  /**
   * @type {ReturnType<typeof useState<EditorView>>}
   */
  const [ editorView, setEditorView ] = useState();

  /**
   * @type {ReturnType<typeof useState<string?>>}
   */
  const [ error, setError ] = useState();

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const source = (view) => {
      const errors = jsonParseLinter()(view);

      const hasError = errors && errors.length > 0;

      onErrorChange(hasError ? INVALID_JSON_ERROR : null);

      setError(hasError ? INVALID_JSON_ERROR : null);

      return errors;
    };

    const editorState = EditorState.create({
      doc: value,
      extensions: [
        autocompletion(),
        closeBrackets(),
        bracketMatching(),
        indentOnInput(),
        keymap.of([
          ...defaultKeymap
        ]),
        new Compartment().of(json()),
        new Compartment().of(EditorState.tabSize.of(2)),
        EditorView.contentAttributes.of({
          'aria-label': 'JSON editor',
          'tabindex': '0'
        }),
        linter(source, { delay: 300 }),
        autocompletionCompartment.of(getAutocompletionExtensions(variables)),
        placeholder(PLACEHOLDER_TEXT),
        theme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            if (update.transactions.some(transaction => transaction.annotation(fromPropAnnotation))) {
              return;
            }

            const newValue = update.state.doc.toString();

            onChange(newValue);
          }
        })
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
  }, [ onChange ]);

  useEffect(() => {
    if (!editorView) return;

    editorView.dispatch({
      effects: autocompletionCompartment.reconfigure(
        getAutocompletionExtensions(variables)
      )
    });
  }, [ variables ]);

  useEffect(() => {
    if (!editorView) return;

    const editorValue = editorView.state.doc.toString();

    if (value !== editorValue) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorValue.length,
          insert: value
        },
        annotations: fromPropAnnotation.of(true)
      });
    }
  }, [ editorView, value ]);

  return <div className={ classNames('code__editor', { 'code__editor--error': error }) }>
    <div className="code__editor-codemirror">
      <div ref={ ref } className="code__editor-codemirror-inner"></div>
    </div>
    { error && <div className="code__editor-error">{ error }</div> }
  </div>;
}