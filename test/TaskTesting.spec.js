import { render, screen } from '@testing-library/react';

import { bootstrapModeler, inject } from './util/Util';

import TaskTesting from '../lib';

import diagramXML from './fixtures/diagram.bpmn';

describe('TaskTesting', function() {

  beforeEach(bootstrapModeler(diagramXML));


  it('should render', inject(function(injector) {

    // when
    render(<TaskTesting
      injector={ injector }
      deploy={ () => {} }
      startInstance={ () => {} }
      getInstance={ () => {} }
      config={ {} }
      onConfigChanged={ () => {} }
    />);

    // then
    expect(screen.getByText('Select a single task on the canvas.')).to.exist;
  }));

});