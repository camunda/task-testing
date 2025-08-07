import { EditorView } from '@codemirror/view';
import { autocompletion, startCompletion, snippetCompletion } from '@codemirror/autocomplete';
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
  const lineText = line.text;
  const posInLine = pos - line.from;

  const rightOfColon = lineText.slice(0, posInLine).includes(':');
  if (rightOfColon) {
    return null;
  }

  const node = syntaxTree(state).resolve(pos, -1);
  const word = state.sliceDoc(node.from, pos);

  const wordStartsWithQuote = word.startsWith('"');
  const wordEndsWithQuote = lineText[posInLine] === '"';

  const options = variables.map(option => {

    const value = parseValue(option.value);

    let snippetText = `"${option.label}": ${value}`;

    if (wordStartsWithQuote) {
      snippetText = snippetText.slice(1);
    }

    if (wordEndsWithQuote) {
      snippetText = snippetText.slice(0, -1);
    }

    return snippetCompletion(snippetText, option);
  });

  const lineFrom = node.from === 0 ? line.from + posInLine : node.from;
  const from = wordStartsWithQuote ? lineFrom + 1 : lineFrom;
  const to = wordEndsWithQuote ? line.to - 1 : line.to;

  return {
    from: from,
    to: to,
    options: options,
  };

}

function parseValue(value) {

  if (!value) {
    return '"#{}"';
  }

  if (!isNaN(parseFloat(value))) {
    return `#{${value}:${value}}`;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return `"#{${value}}"`;
}