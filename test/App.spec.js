import { render, screen } from '@testing-library/react';

import TaskTesting from '../lib/index.jsx';

import { appProps } from './mock/index.js';

describe('task-testing', function() {

  it('should render', function() {
    render(<TaskTesting { ...appProps } />);

    expect(screen.getByText('Input variables')).to.exist;
    expect(screen.getByText('Activity log')).to.exist;
  });

});