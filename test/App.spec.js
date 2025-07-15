import { render, screen } from '@testing-library/react';

import TaskTesting from '../lib';

import { appProps } from './mock';

describe('task-testing', function() {

  it('should render', function() {
    render(<TaskTesting { ...appProps } />);

    expect(screen.getByText('Input variables')).to.exist;
    expect(screen.getByText('Activity log')).to.exist;
  });

});