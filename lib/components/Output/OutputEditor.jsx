import React, { useRef, useEffect, useState } from 'react';

import { Button } from '@carbon/react';
import { Copy } from '@carbon/icons-react';

import { EditorState } from '@codemirror/state';
import { EditorView, Decoration, ViewPlugin } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import { syntaxTree } from '@codemirror/language';
import theme from '../shared/CodeMirrorTheme';


/**
 * Create a ViewPlugin that adds plus icon decorations to lines containing added variables
 * @param {Array<string>} addedVariables - Array of variable names that are new
 * @returns {ViewPlugin}
 */
function createPlusIconPlugin(addedVariables) {
  return ViewPlugin.fromClass(class {
    constructor(view) {
      this.decorations = this.buildDecorations(view, addedVariables);
    }

    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view, addedVariables);
      }
    }

    buildDecorations(view, variables) {
      if (!variables || variables.length === 0) {
        return Decoration.none;
      }

      const decorations = [];
      const tree = syntaxTree(view.state);
      const doc = view.state.doc;

      tree.iterate({
        enter(node) {
          if (node.name === 'PropertyName') {

            // Get the text content of the property name (including quotes)
            const propertyText = doc.sliceString(node.from, node.to);

            // Remove quotes to get the actual property name
            const propertyName = propertyText.replace(/^"(.*)"$/, '$1');

            // Check if this property is in our added variables list
            if (variables.includes(propertyName)) {

              // Get the line containing this property
              const line = doc.lineAt(node.from);

              // Create a line decoration for the plus icon
              const decoration = Decoration.line({
                class: 'cm-line-plus-icon'
              });

              decorations.push(decoration.range(line.from));
            }
          }
        }
      });

      return Decoration.set(decorations);
    }
  }, {
    decorations: v => v.decorations
  });
}

/**
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {Array<string>} [props.added] - List of variable names that should be marked as new
 * @param {Array<string>} [props.modified] - List of variable names that should be marked as modified
 */
export default function OutputEditor({ value, added, modified }) {

  const ref = useRef(null);

  /**
   * @type {ReturnType<typeof useState<EditorView>>}
   */
  const [ editorView, setEditorView ] = useState();

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const editorState = EditorState.create({
      doc: value,
      extensions: [
        json(),
        EditorState.tabSize.of(2),
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        theme,
        createPlusIconPlugin(added || []),
      ]
    });

    const view = new EditorView({
      state: editorState,
      parent: ref.current,
    });

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, [ added ]); // Recreate editor when added variables change

  useEffect(() => {
    if (!editorView) return;

    const editorValue = editorView.state.doc.toString();

    if (value !== editorValue) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorValue.length,
          insert: value
        }
      });
    }
  }, [ editorView, value ]);

  return <div className="code__editor">
    <Button
      className="code__editor-copy-button"
      renderIcon={ Copy }
      iconDescription="Copy to clipboard"
      size="sm"
      kind="ghost"
      hasIconOnly
      onClick={ () => {
        navigator.clipboard.writeText(value);
      } } />
    <div className="code__editor-codemirror">
      <div ref={ ref } className="code__editor-codemirror-inner"></div>
    </div>
  </div>;
}