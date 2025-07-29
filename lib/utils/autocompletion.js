import { EditorView } from '@codemirror/view';
import { autocompletion, startCompletion, snippetCompletion } from '@codemirror/autocomplete';

export function getAutocompletionExtensions(variables) {
  return [
    autoCompletionExtension(variables),
    startCompletionExtension(),
  ];
}

/*
1) Typing in an empty line or with only whitespace => trigger autocompletion manually with startCompletion ✅
2) Typing inside quotes => autocompletion is activated automatically with variable names
3) Typing inside quotes after a colon => autocompletion is activated automatically with values
*/

function autoCompletionExtension(variables) {
  console.log(variables);
  return autocompletion({
    override: [
      (context) => autocomplete(context, variables)
    ]
  });
}

function autocomplete(context, variables) {
  console.log('autocomplete called', variables);
  const { state, pos } = context;

  const line = state.doc.lineAt(pos);
  const lineText = line.text;
  const posInLine = pos - line.from;

  const hasCompleteKeyValuePair = /.*:\s*"[^"]*"/.test(lineText);
  if (hasCompleteKeyValuePair) {
    console.log('Complete key-value pair detected, skipping autocompletion');
    return null;
  }

  // Find the start of the current word/token being typed
  let wordStart = posInLine;

  let quoteStart = -1;
  for (let i = 0; i < posInLine; i++) {
    if (line.text[i] === '"') {
      if (quoteStart === -1) {
        quoteStart = i;
      } else {
        quoteStart = -1;
      }
    }
  }

  if (quoteStart !== -1) {

    // We're inside quotes, start from after the opening quote
    wordStart = quoteStart + 1;
  } else {

    // Find word boundary normally
    while (wordStart > 0 && /[\w"]/.test(lineText[wordStart - 1])) {
      wordStart--;
    }
  }

  const insideQuotes = quoteStart !== -1;


  // const trimmedLine = lineText.trim();
  // const currentWord = lineText.slice(wordStart, posInLine);

  // const isOnlyWordInLine = trimmedLine === currentWord || trimmedLine === `"${currentWord}` || trimmedLine === `${currentWord}"` || trimmedLine === `"${currentWord}"`;

  // console.log('only work', isOnlyWordInLine, 'currentWord:', currentWord);

  // Check if we're typing a property name (only at start of line or after whitespace)
  // const isTypingProperty = /^\s*"?[\w]*"?\s*:?\s*$/.test(lineText);
  console.log('lineText:', lineText, 'pos:', posInLine);
  const isTypingProperty = lineText.indexOf(':') === -1 || lineText.indexOf(':') > posInLine;

  console.log('isTypingProperty:', isTypingProperty);

  // Check if user is typing on the right side of a JSON property (after colon, inside value quotes)
  // Pattern: "key": "value..." where cursor is after colon and inside quotes
  // OR "key": | where cursor is after colon (outside quotes)
  const colonIndex = lineText.indexOf(':');
  const hasColon = colonIndex !== -1;
  const afterColon = hasColon && posInLine > colonIndex;

  // Check if there's already a complete quoted value after the colon
  const textAfterColon = hasColon ? lineText.slice(colonIndex + 1) : '';
  const hasCompleteQuotedValue = /^\s*"[^"]*"\s*$/.test(textAfterColon);

  // Make sure we're inside quotes that come after the colon (not before it)
  // OR we're after the colon but not inside quotes AND there's no complete quoted value yet
  const enteringValue = hasColon && afterColon && (
    (insideQuotes && quoteStart > colonIndex) || // Inside quotes after colon
    (!insideQuotes && !hasCompleteQuotedValue) // Or not inside quotes, after colon, and no complete value yet
  );

  if (enteringValue) {
    console.log('Entering value, showing autocompletion');
  }


  const options = variables.map(option => {

    const snippetText = option.value
      ? `"${option.label}": "${option.value}"`
      : `"${option.label}": "#{}"`;

    return snippetCompletion(snippetText, option);
  });

  return {
    from: line.from + wordStart,
    to: line.to - (insideQuotes ? 1 : 0),
    options: options,
    validFor: /^"?[\w]*"?$/
  };

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
