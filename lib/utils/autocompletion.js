import { EditorView } from '@codemirror/view';
import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

import { renderToStaticMarkup } from 'react-dom/server';

import { map } from 'min-dash';

/**
 * @typedef {import('@codemirror/autocomplete').Completion} Completion
 * @typedef {import('@codemirror/autocomplete').CompletionContext} CompletionContext
 * @typedef {import('@codemirror/autocomplete').CompletionResult} CompletionResult
 */

/**
 * @param {import('../types').Variables} variables
 */
export function getAutocompletionExtensions(variables) {
  const autocompletions = map(variables, (variable) => createCompletionVariable(variable));
  return [
    autoCompletionExtension(autocompletions),
    startCompletionExtension(),
  ];
}

/**
 * @param {Completion[]} variables
 */
function autoCompletionExtension(variables) {
  return autocompletion({
    override: [
      (context) => autocomplete(context, variables)
    ]
  });
}

/**
 * Trigger autocompletion when the user goes into a new line.
 */
function startCompletionExtension() {
  return EditorView.updateListener.of((update) => {
    if (update.selectionSet || update.docChanged) {
      const { state } = update;
      const pos = state.selection.main.head;
      const node = syntaxTree(state).resolve(pos, -1);

      if (![ 'Object', 'PropertyName', '⚠' ].includes(node.name)) {
        return null;
      }

      const line = state.doc.lineAt(pos);

      const isEmptyLine = line.text.trim() === '';

      if (isEmptyLine) {
        setTimeout(() => {
          startCompletion(update.view);
        }, 100);
      }
    }
  });
}

/**
 * @param {CompletionContext} context
 * @param {Completion[]} variables
 *
 * @returns {CompletionResult | null}
 */
function autocomplete(context, variables) {
  const { state, pos } = context;

  const line = state.doc.lineAt(pos);

  const posInLine = pos - line.from;

  const isAfterColon = line.text.slice(0, posInLine).includes(':');

  if (isAfterColon) {
    return null;
  }

  const node = syntaxTree(state).resolve(pos, -1);

  if (![ 'Object', 'PropertyName', '⚠' ].includes(node.name)) {
    return null;
  }

  const word = state.sliceDoc(node.from, pos);

  const wordStartsWithQuote = word.startsWith('"');
  const wordEndsWithQuote = line.text[posInLine] === '"';

  const options = variables.map(variable => {

    const { apply: value = '' } = variable;

    return {
      ...variable,
      apply: (view, completion, from, to) => {
        const sliceWithQuotes = view.state.sliceDoc(from - 1, to + 1);

        const startsWithQuote = sliceWithQuotes.startsWith('"'),
              endsWithQuote = sliceWithQuotes.endsWith('"');

        if (startsWithQuote) from -= 1;
        if (endsWithQuote) to += 1;

        let insert = `"${variable.label}": ,`;

        let anchor = from + insert.length - 1,
            head = anchor;

        if (variable.detail === 'Number') {
          insert = `"${variable.label}": ${value},`;
          anchor = from + insert.length - 1 - value.toString().length;
          head = from + insert.length - 1;
        } else if (variable.detail === 'Boolean') {
          insert = `"${variable.label}": ${value},`;
          anchor = from + insert.length - 1 - value.toString().length;
          head = from + insert.length - 1;
        } else if (variable.detail === 'Context') {
          insert = `"${variable.label}": {},`;
          anchor = from + insert.length - 2;
          head = anchor;
        } else if (variable.detail === 'String') {

          // escape double quotes in string values
          const valueNoQuotes = value.replace(/"/g, '\\"');

          insert = `"${variable.label}": "${valueNoQuotes}",`;
          anchor = from + insert.length - 2 - valueNoQuotes.length;
          head = from + insert.length - 2;
        } else if (variable.detail === 'Object' || variable.detail === 'Array' || variable.detail === 'null') {
          insert = `"${variable.label}": ${JSON.stringify(value, null, 2)},`;

          // based on the current indentation, indent the inserted object/array
          const indentation = line.text.slice(0, line.text.search(/\S|$/));

          insert = insert.split('\n').map((line, i) => i === 0 ? line : indentation + line).join('\n');

          anchor = from + `"${variable.label}": `.length;
          head = from + insert.length - 1;
        }

        // remove trailing comma if there is no property after
        if (!hasPropertyAfter(view.state, to)) {
          insert = insert.slice(0, -1);
        }

        const transaction = view.state.update({
          changes: {
            from,
            to,
            insert
          },
          selection: {
            anchor,
            head
          }
        });

        view.dispatch(transaction);
      }
    };
  });

  const lineFrom = node.name === 'Object' ? pos : node.from;
  const from = wordStartsWithQuote ? lineFrom + 1 : lineFrom;
  const to = wordEndsWithQuote ? line.to - 1 : line.to;

  return {
    from: from,
    to: to,
    options: options
  };
}

/**
 * Check if there is a property after the current position by looking for a `"` character.
 *
 * @param {*} state
 * @param {number} pos
 *
 * @returns {boolean}
 */
function hasPropertyAfter(state, pos) {
  const textAfter = state.sliceDoc(pos).trimStart();

  return textAfter && textAfter[0] === '"';
}

/**
 * Create CodeMirror autocompletion entry from a variable.
 *
 * @param {import('../types').Variable} variable
 *
 * @returns {import('@codemirror/autocomplete').Completion}
 */
function createCompletionVariable(variable) {
  const {
    name,
    value,
    type,
    source,
  } = variable;

  return {
    label: name,
    type: source === 'PROCESS' ? 'variable' : 'constant',
    info: () => createInfoNode(variable),
    detail: `[${type.toLowerCase()}]`,
    apply: type === 'Object' ? JSON.stringify(value) : value?.toString()
  };
}

/**
 * Create a custom CodeMirror autocompletion info HTML node.
 *
 * @param {import('../types').Variable} variable
 *
 * @returns {HTMLElement}
 */
function createInfoNode({ value, scope, source, sourceElementName }) {
  const div = document.createElement('div');
  const valueString = typeof value === 'object' ? JSON.stringify(value, null, 2) : value?.toString();

  const htmlString = renderToStaticMarkup(
    <div className="info">
      <div className="info-header">
        <span>{scope === 'LOCAL' ? 'Local' : 'Process'}</span>
        {source === 'OUTPUT' && <span>(output)</span>}
        <span>variable</span>
        {sourceElementName && <span>of {sourceElementName}</span>}
      </div>
      {valueString && <pre>{valueString}</pre>}
    </div>
  );

  div.innerHTML = htmlString;

  return div;
}