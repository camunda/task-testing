import React from 'react';

import { render, fireEvent, act } from '@testing-library/react';

import OutputEditor from '../../../lib/components/Output/OutputEditor';

describe('OutputEditor', function() {

  const VALUE = JSON.stringify({ result: { score: 42 } }, null, 2);

  function renderEditor(props = {}) {
    return render(
      <div className="task-testing__container">
        <OutputEditor value={ VALUE } { ...props } />
      </div>
    );
  }


  it('should not render the action menu on mount', function() {

    // when
    renderEditor();

    // then
    expect(document.body.textContent).not.to.contain('Copy as JSON');
  });


  it('should not crash on mousemove over the editor', function() {

    // given — in jsdom, posAtCoords returns null; handler must exit gracefully
    const { container } = renderEditor();
    const editorEl = container.querySelector('.code__editor-codemirror');

    // when / then — no throw
    act(() => {
      fireEvent.mouseMove(editorEl, { clientX: 10, clientY: 10 });
    });
  });


  it('should not crash on mouseleave', function() {

    // given
    const { container } = renderEditor();
    const editorEl = container.querySelector('.code__editor-codemirror');

    // when / then — no throw
    act(() => {
      fireEvent.mouseLeave(editorEl);
    });
  });

});
