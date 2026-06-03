import React from 'react';

import { render, within } from '@testing-library/react';

import ResultActionMenu from '../../../lib/components/Output/ResultActionMenu';

describe('ResultActionMenu', function() {

  const defaultProps = {
    open: true,
    x: 0,
    y: 0,
    path: 'result.body.status',
    value: 200,
    propKey: 'status',
    element: { id: 'Task_1' },
    onClose: () => {}
  };

  function renderMenu(props = {}) {
    return render(<ResultActionMenu { ...defaultProps } { ...props } />);
  }


  it('should always render the stable copy actions and FEEL Playground link', function() {

    // when
    renderMenu();

    // then — Carbon Menu portals to document.body
    expect(document.body.textContent).to.contain('Copy value');
    expect(document.body.textContent).to.contain('Copy key with path');
    expect(document.body.textContent).to.contain('Open in FEEL Playground');
  });


  it('should show "Copy key" when propKey is provided', function() {

    // when
    renderMenu({ propKey: 'status' });

    // then — exact-text match to avoid matching "Copy key with path"
    expect(within(document.body).queryAllByText('Copy key', { exact: true }).length).to.be.greaterThan(0);
  });


  it('should hide "Copy key" when propKey is absent (e.g. array item)', function() {

    // when
    renderMenu({ propKey: '' });

    // then — exact-text match to avoid matching "Copy key with path"
    expect(within(document.body).queryAllByText('Copy key', { exact: true }).length).to.equal(0);
  });


  it('should hide "Add to output mapping" when callback is absent', function() {

    // when
    renderMenu();

    // then
    expect(document.body.textContent).to.not.contain('Add to output mapping');
  });


  it('should show "Add to output mapping" when callback is provided and propKey is set', function() {

    // when
    renderMenu({ onAppendOutputMapping: () => {} });

    // then
    expect(document.body.textContent).to.contain('Add to output mapping');
  });


  it('should hide "Add to output mapping" when propKey is empty even with callback', function() {

    // when
    renderMenu({ onAppendOutputMapping: () => {}, propKey: '' });

    // then
    expect(document.body.textContent).to.not.contain('Add to output mapping');
  });


  it('should hide "Go to output mapping" when callback is absent', function() {

    // when
    renderMenu();

    // then
    expect(document.body.textContent).to.not.contain('Go to output mapping');
  });


  it('should show "Go to output mapping" when callback is provided and propKey is set', function() {

    // when
    renderMenu({ onNavigateToOutputMapping: () => {} });

    // then
    expect(document.body.textContent).to.contain('Go to output mapping');
  });


  it('should not contain removed actions', function() {

    // when
    renderMenu({ onAppendOutputMapping: () => {}, onNavigateToOutputMapping: () => {} });

    // then — old labels no longer present
    expect(document.body.textContent).to.not.contain('Copy as JSON');
    expect(document.body.textContent).to.not.contain('Copy as FEEL');
    expect(document.body.textContent).to.not.contain('Copy path');
    expect(document.body.textContent).to.not.contain('Save as example data');
    expect(document.body.textContent).to.not.contain('Append to output mapping');
  });

});
