import { render, screen } from '@testing-library/react';

import TaskTesting from '../lib';

import { appProps } from './mock';

describe('task-testing', function() {

  it('should render', function() {

    // when
    render(<TaskTesting { ...appProps } />);

    // then
    expect(screen.getByText('Select a single task on the canvas.')).to.exist;
  });

});