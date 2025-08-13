import { autocompletion, startCompletion, snippetCompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

export function getAutocompletionExtensions(variables) {
  return [
    autoCompletionExtension(variables),
    startCompletionExtension(),
  ];
}

/**
 * @param {import('../types').Variables} variables
 *
 * @returns {import('@codemirror/autocomplete').CompletionSource}
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
    if (!(update.selectionSet || update.docChanged)) {
      return;
    }

    const { state, view } = update;
    const pos = state.selection.main.head;
    if (!isInsideRootObject(state, pos)) {
      return; // stop if outside root object
    }

    const line = state.doc.lineAt(pos);

    const trimmed = line.text.trim();
    const isEmptyLine = trimmed === '';

    // Prevent triggering after comma or closing brace
    const lastCharBeforeCursor = state.sliceDoc(Math.max(0, pos - 1), pos).trim();
    const isAfterCommaOrBrace = [ ',', '}' ].includes(lastCharBeforeCursor);

    if (isEmptyLine && !isAfterCommaOrBrace) {

      // Delay start so CM finishes its own update cycle
      setTimeout(() => {
        startCompletion(view);
      }, 100);
    }
  });
}

/**
 * Get autocomplete suggestions for a given context and set of variables.
 *
 * @param {import('@codemirror/state').EditorState} context
 * @param {import('../types').Variables} variables
 *
 * @returns {import('@codemirror/autocomplete').CompletionResult|null}
 */
function autocomplete(context, variables) {
  const { state, pos } = context;

  if (!isInsideRootObject(state, pos)) {
    return null; // stop if outside root object
  }

  const node = syntaxTree(state).resolveInner(pos, -1);

  const insidePropertyName = node.name === 'PropertyName';
  const insideObject = findParentNode(node, 'Object');

  // If we're inside a value (after colon), bail
  const valueNodeNames = [ 'String', 'Number', 'Array', 'True', 'False', 'Null' ];
  if (valueNodeNames.includes(node.name) && !insidePropertyName) {
    return null;
  }

  // Also: if we're inside a Property but cursor is after the colon token
  const parentProperty = findParentNode(node, 'Property');
  if (parentProperty) {
    const colonPos = state.sliceDoc(parentProperty.from, parentProperty.to).indexOf(':');
    if (colonPos !== -1) {
      const colonAbsolute = parentProperty.from + colonPos + 1; // position right after colon

      // If cursor is immediately after colon and NOT inside a nested object → bail
      const immediateAfterColon = pos <= colonAbsolute + 1;
      const insideNestedObject = findParentNode(node, 'Object') !== findParentNode(parentProperty, 'Object');

      if (immediateAfterColon && !insideNestedObject) {
        return null;
      }
    }
  }

  // Text around cursor
  const before = state.sliceDoc(Math.max(0, pos - 1), pos);
  const after = state.sliceDoc(pos, pos + 1);

  const atEmptySpot =
    insideObject &&
    ![ '"', ',', '}' ].includes(before.trim()) &&
    after.trim() === '';

  if (!insidePropertyName && !atEmptySpot && !context.explicit) {
    return null;
  }

  const path = getJsonPath(node);

  const matchingVars = variables.filter(v => {
    return !path.length || v.path?.join('.') === path.join('.');
  });

  const options = matchingVars.map(option => {
    const value = parseValue(option.value);

    return snippetCompletion(`"${option.label}": ${value}`, option);
  });

  const from = insidePropertyName
    ? node.from + (state.sliceDoc(node.from, pos).startsWith('"') ? 1 : 0)
    : pos;

  return { from, to: pos, options };
}

function findParentNode(node, name) {
  let currentNode = node;

  while (currentNode) {
    if (currentNode.name === name) {
      return currentNode;
    }

    currentNode = currentNode.parent;
  }

  return null;
}

function getJsonPath(node) {
  const path = [];

  let currentNode = node;

  while (currentNode) {
    if (currentNode.name === 'Property') {
      const keyNode = currentNode.getChild('PropertyName');

      if (keyNode) {
        let key = keyNode.type.isError
          ? ''
          : keyNode.name === 'String'
            ? stripQuotes(keyNode.nodeText || '')
            : keyNode.nodeText || '';
        path.unshift(key);
      }
    }

    currentNode = currentNode.parent;
  }

  // Remove the last element (the property being edited)
  path.pop();

  return path;
}

function stripQuotes(str) {
  return str.replace(/^"(.*)"$/, '$1');
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

function isInsideRootObject(state, pos) {
  const root = syntaxTree(state).topNode;

  const rootObject = root.getChild('Object');

  return rootObject && pos > rootObject.from && pos < rootObject.to;
}
