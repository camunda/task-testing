import { EditorView } from '@codemirror/view';
import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

export function getAutocompletionExtensions(variables) {
  return [
    autoCompletionExtension(variables),
    startCompletionExtension(),
  ];
}

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

function autocomplete(context, variables) {
  const { state, pos } = context;

  const line = state.doc.lineAt(pos);

  const posInLine = pos - line.from;

  const isAfterColon = line.text.slice(0, posInLine).includes(':');

  if (isAfterColon) {
    return null;
  }

  const node = syntaxTree(state).resolve(pos, -1);
  const word = state.sliceDoc(node.from, pos);

  const wordStartsWithQuote = word.startsWith('"');
  const wordEndsWithQuote = line.text[posInLine] === '"';

  const options = variables.map(variable => {
    return {
      label: variable.label,
      type: 'variable',
      info: variable.info,
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
          insert = `"${variable.label}": "${variable.value}",`;
          anchor = from + insert.length - 2 - variable.value.length;
          head = from + insert.length - 2;
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