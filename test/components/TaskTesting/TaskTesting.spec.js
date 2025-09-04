import { render, screen } from '@testing-library/react';

import { bootstrapModeler, inject } from '../../util/Util';

import TaskTesting, { NO_ELEMENT_TEXT } from '../../../lib/components/TaskTesting/TaskTesting';

import diagramXML from '../../fixtures/diagram.bpmn';

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
    expect(screen.getByText(NO_ELEMENT_TEXT)).to.exist;
  }));

});