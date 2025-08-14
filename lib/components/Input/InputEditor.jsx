import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { basicSetup } from 'codemirror';
import { Compartment, EditorState, Annotation } from '@codemirror/state';
import { EditorView, placeholder } from '@codemirror/view';
import { linter } from '@codemirror/lint';
import { json, jsonParseLinter } from '@codemirror/lang-json';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { getAutocompletionExtensions } from '../../utils/autocompletion';

const fromPropAnnotation = Annotation.define();

const autocompletionCompartment = new Compartment();

const DEFAULT_OUTPUT = {},
      DEFAULT_VARIABLES_FOR_ELEMENT = [];

export default function InputEditor({
  element,
  value,
  onChange,
  onHasErrorChange,
  output = DEFAULT_OUTPUT,
  variablesForElement = DEFAULT_VARIABLES_FOR_ELEMENT
}) {
  const autocompletion = useMemo(() => {
    const variablesForElementAutocompletions = variablesForElement.filter(variable => {

      // Filter out variables originating from the element's inputs or outputs
      return variable.origin.every(origin => origin !== getBusinessObject(element));
    }).map(({ name, detail, info }) => ({
      label: name,
      type: 'variable',
      info: () => getAutocompletionInfo(info, 'From process variables'),
      detail: detail ? `[${ detail }]` : undefined,
      value: info ? info : undefined,
    }));

    const { variables = {} } = output;

    const outputVariablesAutocompletions = Object.entries(variables).map(([ name, variable ]) => ({
      label: name,
      type: 'constant',
      info: () => getAutocompletionInfo(variable.value, 'From output variables'),
      detail: `[${ typeof variable.value }]`,
      value: variable.value
    }));

    return [ ...variablesForElementAutocompletions, ...outputVariablesAutocompletions ];
  }, [ output, variablesForElement ]);

  const ref = useRef(null);

  const [ editorView, setEditorView ] = useState(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const source = (view) => {
      const errors = jsonParseLinter()(view);

      const hasError = errors && errors.length > 0;

      onHasErrorChange(hasError);

      if (errors && errors.length > 0) {
        const errorMessage = errors[0].message || 'Error';
        ref.current?.style.setProperty('--error-message', `"${errorMessage}"`);
      } else {
        ref.current?.style.removeProperty('--error-message');
      }

      return errors;
    };

    const editorState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        json(),
        linter(source, { delay: 100 }),
        autocompletionCompartment.of(getAutocompletionExtensions(autocompletion)),
        placeholder('Provide process variables in JSON format'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            if (update.transactions.some(transaction => transaction.annotation(fromPropAnnotation))) {
              return;
            }

            const newValue = update.state.doc.toString();

            onChange(newValue);
          }
        }),
      ],
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
        getAutocompletionExtensions(autocompletion)
      )
    });
  }, [ autocompletion, editorView ]);

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

  return <div ref={ ref } className="input-editor" />;
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
