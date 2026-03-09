import { EditorView } from '@codemirror/view';
import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

/**
 * @import {
 *  Completion,
 *  CompletionContext,
 *  CompletionResult
 * } from '@codemirror/autocomplete';
 */

/**
 * @param {Completion[]} variables
 */
export function getAutocompletionExtensions(variables) {
  return [
    autoCompletionExtension(variables),
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

      if (!shouldStartCompletion(node)) {
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
 * @param {Array} variables
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

  if (!shouldStartCompletion(node)) {
    return null;
  }

  const word = state.sliceDoc(node.from, pos);

  const wordStartsWithQuote = word.startsWith('"');
  const wordEndsWithQuote = line.text[posInLine] === '"';

  const options = variables.map(variable => {
    return {
      label: variable.label,
      type: variable.type,
      info: variable.info,
      detail: variable.detail,
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
          insert = `"${variable.label}": ${variable.value},`;
          anchor = from + insert.length - 1 - variable.value.toString().length;
          head = from + insert.length - 1;
        } else if (variable.detail === 'Boolean') {
          insert = `"${variable.label}": ${variable.value},`;
          anchor = from + insert.length - 1 - variable.value.toString().length;
          head = from + insert.length - 1;
        } else if (variable.detail === 'Context') {
          insert = `"${variable.label}": {},`;
          anchor = from + insert.length - 2;
          head = anchor;
        } else if (variable.detail === 'String') {

          // escape double quotes in string values
          const value = variable.value.replace(/"/g, '\\"');

          insert = `"${variable.label}": "${value}",`;
          anchor = from + insert.length - 2 - value.length;
          head = from + insert.length - 2;
        } else if (variable.detail === 'Object' || variable.detail === 'Array' || variable.detail === 'null') {
          insert = `"${variable.label}": ${JSON.stringify(variable.value, null, 2)},`;

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

function shouldStartCompletion(node) {

  // Do not show autocompletion inside nested properties
  if (!isNodeAtJsonRoot(node)) {
    return false;
  };

  return [ 'Object', 'PropertyName', '⚠' ].includes(node.name);
}

function isNodeAtJsonRoot(node) {
  let depth = 0;
  let current = node;

  while (current.parent) {

    if (current.name === 'Object') {
      depth++;
    }

    if (depth > 1) {
      return false;
    }

    current = current.parent;
  }

  return true;
}