import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';

import {
  resolveJsonNode,
  toFeelPath
} from '../../lib/utils/jsonPath';

/**
 * Build an EditorState with the JSON language for a given document.
 *
 * @param {string} doc
 * @returns {EditorState}
 */
function createState(doc) {
  return EditorState.create({
    doc,
    extensions: [ json() ]
  });
}

/**
 * Resolve the node enclosing the first occurrence of `needle` in `doc`.
 *
 * @param {string} doc
 * @param {string} needle
 * @returns {ReturnType<typeof resolveJsonNode>}
 */
function resolveAt(doc, needle) {
  const state = createState(doc);
  const from = doc.indexOf(needle);
  const to = from + needle.length;

  return resolveJsonNode(state, { from, to });
}

describe('utils/jsonPath', function() {

  describe('#resolveJsonNode', function() {

    const DOC = JSON.stringify({
      result: {
        flags: { racist: false },
        score: 42
      },
      items: [
        { id: 'a' },
        { id: 'b' }
      ]
    }, null, 2);


    it('should resolve a nested value selection', function() {

      // when
      const resolved = resolveAt(DOC, 'false');

      // then
      expect(resolved).to.exist;
      expect(resolved.path).to.equal('result.flags.racist');
      expect(resolved.value).to.equal(false);
      expect(resolved.kind).to.equal('value');
    });


    it('should resolve a key selection to its value', function() {

      // when
      const resolved = resolveAt(DOC, '"score"');

      // then
      expect(resolved.path).to.equal('result.score');
      expect(resolved.value).to.equal(42);
      expect(resolved.kind).to.equal('key');
    });


    it('should resolve a whole object subtree selection', function() {

      // given — select the Object after "flags"
      const state = createState(DOC);
      const flagsKey = DOC.indexOf('"flags"');
      const open = DOC.indexOf('{', flagsKey);
      const close = DOC.indexOf('}', open);

      // when
      const resolved = resolveJsonNode(state, { from: open, to: close + 1 });

      // then
      expect(resolved.path).to.equal('result.flags');
      expect(resolved.value).to.eql({ racist: false });
      expect(resolved.kind).to.equal('subtree');
    });


    it('should resolve an array item value with index', function() {

      // when — second item's id value 'b'
      const resolved = resolveAt(DOC, '"b"');

      // then
      expect(resolved.path).to.equal('items[1].id');
      expect(resolved.value).to.equal('b');
    });


    it('should resolve an array item subtree with index', function() {

      // given — select the first array object
      const state = createState(DOC);
      const itemsKey = DOC.indexOf('"items"');
      const open = DOC.indexOf('{', itemsKey);
      const close = DOC.indexOf('}', open);

      // when
      const resolved = resolveJsonNode(state, { from: open, to: close + 1 });

      // then
      expect(resolved.path).to.equal('items[0]');
      expect(resolved.value).to.eql({ id: 'a' });
      expect(resolved.kind).to.equal('subtree');
    });


    it('should return null for invalid JSON', function() {

      // given
      const state = createState('{ not json');

      // when
      const resolved = resolveJsonNode(state, { from: 2, to: 5 });

      // then
      expect(resolved).to.be.null;
    });

  });


  describe('#toFeelPath', function() {

    it('should pass through a plain dotted path', function() {
      expect(toFeelPath('result.flags.racist')).to.equal('result.flags.racist');
    });


    it('should convert array indices to 1-based', function() {
      expect(toFeelPath('items[0].id')).to.equal('items[1].id');
    });


    it('should convert multiple array indices', function() {
      expect(toFeelPath('matrix[0][2]')).to.equal('matrix[1][3]');
    });

  });

});
