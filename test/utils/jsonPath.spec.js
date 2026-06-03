import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';

import {
  resolveJsonNode,
  toFeelPath,
  toFeelValue,
  getLastSegment
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

/**
 * Resolve the node at the cursor position of the first occurrence of `needle`.
 * Simulates a hover (point query) rather than a text selection.
 *
 * @param {string} doc
 * @param {string} needle
 * @returns {ReturnType<typeof resolveJsonNode>}
 */
function resolveAtPoint(doc, needle) {
  const state = createState(doc);
  const pos = doc.indexOf(needle);

  return resolveJsonNode(state, { from: pos, to: pos });
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


    describe('nodeFrom / nodeTo (hover highlight range)', function() {

      it('should return the full Property range when cursor is on a key', function() {

        // when — cursor on the "score" key
        const resolved = resolveAtPoint(DOC, '"score"');

        // then — range covers '"score": 42' (the whole Property)
        expect(resolved).to.exist;
        expect(resolved.nodeFrom).to.equal(DOC.indexOf('"score"'));
        expect(resolved.nodeTo).to.be.greaterThan(DOC.indexOf('42') + 1);
      });


      it('should return the full Property range when cursor is on a scalar value', function() {

        // when — point-resolve the `false` value (inside "racist": false)
        const resolved = resolveAtPoint(DOC, 'false');

        // then — range covers '"racist": false' (the whole Property, not just `false`)
        const propStart = DOC.lastIndexOf('"racist"', DOC.indexOf('false'));
        expect(resolved).to.exist;
        expect(resolved.nodeFrom).to.equal(propStart);
        expect(resolved.nodeTo).to.be.greaterThan(DOC.indexOf('false') + 'false'.length - 1);
      });


      it('should return the object range when cursor is on the opening brace of a root object', function() {

        // given — point-resolve the root `{`
        const state = createState(DOC);
        const openBrace = DOC.indexOf('{');
        const resolved = resolveJsonNode(state, { from: openBrace, to: openBrace });

        // then — root object has no enclosing Property, so highlights the object itself
        expect(resolved).to.exist;
        expect(resolved.nodeFrom).to.equal(openBrace);
      });

    });


    describe('key field', function() {

      it('should return the last named segment as key for a nested value', function() {

        const resolved = resolveAt(DOC, '"b"');

        expect(resolved).to.exist;
        expect(resolved.key).to.equal('id');
      });


      it('should return an empty string for array-index paths', function() {

        // given — select an array item directly (the first { id: 'a' } object)
        const state = createState(DOC);
        const itemsKey = DOC.indexOf('"items"');
        const open = DOC.indexOf('{', itemsKey);
        const close = DOC.indexOf('}', open);
        const resolved = resolveJsonNode(state, { from: open, to: close + 1 });

        // path is items[0] — no named terminal segment
        expect(resolved).to.exist;
        expect(resolved.key).to.equal('');
      });

    });

  });


  describe('#toFeelValue', function() {

    it('should unquote valid-identifier keys in an object', function() {
      expect(toFeelValue({ status: 200 })).to.equal('{status: 200}');
    });


    it('should unquote nested valid-identifier keys', function() {
      expect(toFeelValue({ body: { userId: 'abc' } })).to.equal('{body: {userId: "abc"}}');
    });


    it('should keep quotes on keys that are not valid identifiers', function() {
      expect(toFeelValue({ 'my-key': 1 })).to.equal('{"my-key": 1}');
    });


    it('should leave scalar string values unchanged', function() {
      expect(toFeelValue('hello')).to.equal('"hello"');
    });


    it('should serialize arrays without index changes', function() {
      expect(toFeelValue([ 1, 2 ])).to.equal('[1, 2]');
    });


    it('should serialize null', function() {
      expect(toFeelValue(null)).to.equal('null');
    });


    it('should serialize booleans', function() {
      expect(toFeelValue(true)).to.equal('true');
      expect(toFeelValue(false)).to.equal('false');
    });

  });


  describe('#getLastSegment', function() {

    it('should return the last key segment', function() {
      expect(getLastSegment('result.body.status')).to.equal('status');
    });


    it('should return empty string when the path ends with an array index', function() {
      expect(getLastSegment('items[0]')).to.equal('');
    });


    it('should return empty string for empty path', function() {
      expect(getLastSegment('')).to.equal('');
    });


    it('should handle a single segment', function() {
      expect(getLastSegment('result')).to.equal('result');
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
