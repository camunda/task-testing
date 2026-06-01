import React from 'react';

import { render } from '@testing-library/react';

import ResultActionMenu from '../../../lib/components/Output/ResultActionMenu';

describe('ResultActionMenu', function() {

  const defaultProps = {
    open: true,
    x: 0,
    y: 0,
    path: 'result.flags.racist',
    value: false,
    element: { id: 'Task_1' },
    onClose: () => {}
  };

  function renderMenu(props = {}) {
    return render(<ResultActionMenu { ...defaultProps } { ...props } />);
  }

  it('should always render the three copy actions', function() {

    // when
    renderMenu();

    // then — Carbon Menu portals to document.body
    expect(document.body.textContent).to.contain('Copy as JSON');
    expect(document.body.textContent).to.contain('Copy as FEEL');
    expect(document.body.textContent).to.contain('Copy path');
  });


  it('should hide delegated actions when callbacks are absent', function() {

    // when
    renderMenu();

    // then
    expect(document.body.textContent).to.not.contain('Save as example data');
    expect(document.body.textContent).to.not.contain('Append to output mapping');
  });


  it('should show "Save as example data" when callback is provided', function() {

    // when
    renderMenu({ onAddToExampleData: () => {} });

    // then
    expect(document.body.textContent).to.contain('Save as example data');
  });


  it('should show "Append to output mapping" when callback is provided', function() {

    // when
    renderMenu({ onAppendOutputMapping: () => {} });

    // then
    expect(document.body.textContent).to.contain('Append to output mapping');
  });

});
