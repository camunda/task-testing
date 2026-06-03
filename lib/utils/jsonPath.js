import { syntaxTree } from '@codemirror/language';

/**
 * @typedef {'key' | 'value' | 'subtree'} JsonSelectionKind
 *
 * @typedef {Object} ResolvedJsonNode
 * @property {string} path - Dotted path to the node, e.g. `result.flags.racist`
 *   or `items[0].id`. Empty string for the document root.
 * @property {*} value - The parsed value at that path.
 * @property {JsonSelectionKind} kind - Whether a key, a value or a whole
 *   object/array subtree was selected.
 * @property {number} nodeFrom - Start character offset of the range to highlight.
 *   Always covers the full enclosing Property (key + colon + value) when inside
 *   one; falls back to the value node for root objects and array items.
 * @property {number} nodeTo - End character offset of the range to highlight.
 * @property {string} key - The last named path segment (property name), e.g.
 *   `"status"` for path `result.body.status`. Empty string for array items and
 *   the document root.
 */

/**
 * Resolve the JSON node enclosing a selection to a dotted path, its value and
 * the kind of node that was selected.
 *
 * Walks the Lezer JSON syntax tree from the selection head up to the enclosing
 * `Property` / value / `Object` / `Array` node and reconstructs the path by
 * walking ancestors. The document is parsed once to index the value by path.
 *
 * @param {import('@codemirror/state').EditorState} state
 * @param {{ from: number, to: number }} range - selection range
 *
 * @returns {ResolvedJsonNode|null} resolved node, or `null` if it cannot be
 *   resolved (e.g. invalid JSON or selection outside any value).
 */
export function resolveJsonNode(state, range) {
  const doc = state.doc.toString();

  let parsed;
  try {
    parsed = JSON.parse(doc);
  } catch {
    return null;
  }

  const tree = syntaxTree(state);

  /** @type {import('@lezer/common').SyntaxNode|null} */
  let node = tree.resolve(range.from, 1);

  // Walk up to the nearest meaningful node: a property name, a value, or a
  // structural Object/Array.
  while (node && !isResolvableNode(node)) {
    node = node.parent;
  }

  if (!node) {
    return null;
  }

  const kind = getSelectionKind(node);

  // For a selected key (PropertyName) or whole Property, resolve the path of
  // the property's value so the ancestor walk reads the property name.
  const property = node.name === 'PropertyName'
    ? node.parent
    : node;

  const valueNode = property && property.name === 'Property'
    ? getPropertyValue(property)
    : node;

  if (!valueNode) {
    return null;
  }

  const path = buildPath(valueNode, doc);
  const value = getValueAtPath(parsed, path);

  let highlightNode;
  if (node.name === 'PropertyName' && node.parent) {
    highlightNode = node.parent;
  } else if (valueNode.parent && valueNode.parent.name === 'Property') {
    highlightNode = valueNode.parent;
  } else {
    highlightNode = valueNode;
  }

  return {
    path,
    value,
    kind,
    nodeFrom: highlightNode.from,
    nodeTo: highlightNode.to,
    key: getLastSegment(path)
  };
}

/**
 * @param {import('@lezer/common').SyntaxNode} node
 * @returns {boolean}
 */
function isResolvableNode(node) {
  return [
    'PropertyName',
    'Property',
    'Object',
    'Array',
    'String',
    'Number',
    'True',
    'False',
    'Null'
  ].includes(node.name);
}

/**
 * Get the value node of a `Property`, i.e. the child after the property name.
 *
 * @param {import('@lezer/common').SyntaxNode} property
 * @returns {import('@lezer/common').SyntaxNode|null}
 */
function getPropertyValue(property) {
  let child = property.firstChild;

  while (child) {
    if (isValueNode(child)) {
      return child;
    }

    child = child.nextSibling;
  }

  return null;
}

/**
 * @param {import('@lezer/common').SyntaxNode} node
 * @returns {JsonSelectionKind}
 */
function getSelectionKind(node) {
  if (node.name === 'PropertyName') {
    return 'key';
  }

  if (node.name === 'Object' || node.name === 'Array') {
    return 'subtree';
  }

  return 'value';
}

/**
 * Reconstruct the dotted path to a value node by walking its ancestors.
 *
 * @param {import('@lezer/common').SyntaxNode} node
 * @param {string} doc
 * @returns {string}
 */
function buildPath(node, doc) {

  /** @type {Array<{ type: 'key', key: string } | { type: 'index', index: number }>} */
  const segments = [];

  /** @type {import('@lezer/common').SyntaxNode|null} */
  let current = node;

  while (current && current.parent) {
    const parent = current.parent;

    if (parent.name === 'Property') {

      // current is the value of a property; read the property name
      const nameNode = parent.getChild('PropertyName');

      if (nameNode) {
        const key = JSON.parse(doc.slice(nameNode.from, nameNode.to));
        segments.unshift({ type: 'key', key });
      }

      current = parent.parent;
    } else if (parent.name === 'Array') {

      // current is an array item; compute its index
      const index = indexInArray(parent, current);
      segments.unshift({ type: 'index', index });

      current = parent;
    } else {
      current = parent;
    }
  }

  return segmentsToPath(segments);
}

/**
 * @param {import('@lezer/common').SyntaxNode} arrayNode
 * @param {import('@lezer/common').SyntaxNode} itemNode
 * @returns {number}
 */
function indexInArray(arrayNode, itemNode) {
  let index = 0;

  let child = arrayNode.firstChild;

  while (child) {
    if (child.from === itemNode.from && child.to === itemNode.to) {
      return index;
    }

    // Count only value children, skipping punctuation like `[`, `,`, `]`.
    if (isValueNode(child)) {
      index++;
    }

    child = child.nextSibling;
  }

  return index;
}

/**
 * @param {import('@lezer/common').SyntaxNode} node
 * @returns {boolean}
 */
function isValueNode(node) {
  return [
    'Object',
    'Array',
    'String',
    'Number',
    'True',
    'False',
    'Null'
  ].includes(node.name);
}

/**
 * @param {Array<{ type: 'key', key: string } | { type: 'index', index: number }>} segments
 * @returns {string}
 */
function segmentsToPath(segments) {
  return segments.reduce((path, segment) => {
    if (segment.type === 'index') {
      return `${path}[${segment.index}]`;
    }

    return path ? `${path}.${segment.key}` : segment.key;
  }, '');
}

/**
 * Index a parsed value by a dotted path produced by {@link buildPath}.
 *
 * @param {*} root
 * @param {string} path
 * @returns {*}
 */
function getValueAtPath(root, path) {
  if (!path) {
    return root;
  }

  let value = root;

  // Split into `key` and `[index]` tokens.
  const tokens = path.match(/[^.[\]]+|\[\d+\]/g) || [];

  for (const token of tokens) {
    if (value == null) {
      return undefined;
    }

    if (token.startsWith('[')) {
      value = value[Number(token.slice(1, -1))];
    } else {
      value = value[token];
    }
  }

  return value;
}

/**
 * Build a FEEL path expression for a dotted JSON path.
 *
 * Array accesses use 1-based indexing as required by FEEL, e.g.
 * `items[0].id` becomes `items[1].id`.
 *
 * @param {string} path
 * @returns {string}
 */
export function toFeelPath(path) {
  return path.replace(/\[(\d+)\]/g, (_, index) => `[${Number(index) + 1}]`);
}

/**
 * Return the last named segment of a dotted path if it is the terminal segment,
 * e.g. `"status"` for `result.body.status`.
 *
 * Returns `""` when the path is empty, the document root, or ends with an array
 * index (e.g. `items[0]`) — array items do not have a standalone key that is
 * meaningful as an output-mapping target name.
 *
 * @param {string} path
 * @returns {string}
 */
export function getLastSegment(path) {
  if (!path) return '';
  const tokens = path.match(/[^.[\]]+|\[\d+\]/g) || [];
  if (!tokens.length) return '';
  const last = tokens[tokens.length - 1];
  return last.startsWith('[') ? '' : last;
}

/**
 * Convert a parsed JS value to a FEEL literal expression.
 *
 * Object keys that are valid FEEL identifiers (`/^[a-zA-Z_][a-zA-Z0-9_]*$/`)
 * are written unquoted; all other keys keep their JSON string form.
 * This matches the FEEL context syntax, which differs from JSON in that
 * valid-identifier keys do not require quotes.
 *
 * @param {*} value
 * @returns {string}
 */
export function toFeelValue(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return '[' + value.map(toFeelValue).join(', ') + ']';
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([ k, v ]) => {
      const key = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : JSON.stringify(k);
      return `${key}: ${toFeelValue(v)}`;
    });
    return '{' + entries.join(', ') + '}';
  }
  return String(value);
}
