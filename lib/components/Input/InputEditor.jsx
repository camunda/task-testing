import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { defaultKeymap } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { Compartment, EditorState, Annotation } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { linter } from '@codemirror/lint';
import { json, jsonParseLinter } from '@codemirror/lang-json';

import classNames from 'classnames';

import theme from './InputEditorTheme';

import { getAutocompletionExtensions } from '../../utils/autocompletion';

const fromPropAnnotation = Annotation.define();

const autocompletionCompartment = new Compartment();

export const PLACEHOLDER_TEXT = 'Enter process variables in JSON format';

const DEFAULT_ALL_OUTPUTS = {},
      DEFAULT_VARIABLES_FOR_ELEMENT = [];

export default function InputEditor({
  allOutputs = DEFAULT_ALL_OUTPUTS,
  element,
  value,
  onChange,
  onErrorChange,
  variablesForElement = DEFAULT_VARIABLES_FOR_ELEMENT
}) {
  const autocompletions = useMemo(() => {
    const variablesForElementAutocompletions = variablesForElement.map(({ name, detail, info }) => ({
      label: name,
      type: 'variable',
      info: () => getAutocompletionInfo(info, 'Process variable'),
      detail,
      value: info ? info : undefined,
    }));

    const allOutputVariables = getAllOutputVariables(allOutputs);

    const outputVariablesAutocompletions = allOutputVariables.map(({ name, value, origin }) => ({
      label: name,
      type: 'variable',
      info: () => getAutocompletionInfo(value, `Output variable from ${origin}`),
      detail: getDetail(value),
      value
    }));

    /**
     * @type {import('@codemirror/autocomplete').Completion[]}
     */
    const result = [ ...variablesForElementAutocompletions, ...outputVariablesAutocompletions ];

    return result;
  }, [ allOutputs, variablesForElement ]);

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

      onErrorChange(hasError ? 'Invalid JSON' : null);

      setError(hasError ? 'Invalid JSON' : null);

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
        autocompletionCompartment.of(getAutocompletionExtensions(autocompletions)),
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
  }, []);

  useEffect(() => {
    if (!editorView) return;

    editorView.dispatch({
      effects: autocompletionCompartment.reconfigure(
        getAutocompletionExtensions(autocompletions)
      )
    });
  }, [ autocompletions, editorView ]);

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

  return <div className={ classNames('input__editor', { 'input__editor--error': error }) }>
    <div className="input__editor-codemirror">
      <div ref={ ref } className="input__editor-codemirror-inner"></div>
    </div>
    { error && <div className="input__editor-error">{ error }</div> }
  </div>;
}

function getAutocompletionInfo(value, description) {
  const div = document.createElement('div');

  const htmlString = renderToStaticMarkup(
    <div className="info">
      <span>{ description }</span>
      {value && <pre>{typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</pre>}
    </div>
  );

  div.innerHTML = htmlString;

  return div;
}

function getAllOutputVariables(allOutputs) {
  const allOutputVariables = [];

  for (const elementId in allOutputs) {
    if (allOutputs[elementId]) {
      const { variables = [] } = allOutputs[ elementId ];

      for (const name in variables) {
        allOutputVariables.push({ name, value: variables[name], origin: elementId });
      }
    }
  }

  return allOutputVariables;
}

/**
 * Get a string representation of the type of a value.
 *
 * @example
 *
 * getDetail('foo') // String
 * getDetail(1337) // Number
 * getDetail(true) // Boolean
 * getDetail({}) // Object
 *
 * @param {any} value
 *
 * @return {string}
 */
function getDetail(value) {
  const type = typeof value;

  if (type === 'object') {
    if (Array.isArray(value)) {
      return 'Array';
    }

    if (value === null) {
      return 'null';
    }

    return 'Object';
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}