import React, { useMemo } from 'react';

import { Button, Tooltip } from '@carbon/react';

import useCamundaContext from '../../hooks/useCamundaContext';


export default function ExampleDataButton({ onClick }) {

  const { elementId, exampleData } = useCamundaContext();

  const tooltipContent = useMemo(() => {
    if (!elementId) {
      return 'Select a task on the canvas';
    }
    if (!exampleData) {
      return 'Selected task has no example data';
    }
    return 'Copy example data to variables editor';
  }, [ elementId, exampleData ]);

  return (
    <Tooltip
      label={ tooltipContent }
      align="bottom"
      leaveDelayMs={ 100 }>
      <span tabIndex="0" style={ { display: 'inline-block' } }>
        <Button
          kind="tertiary"
          size="sm"
          disabled={ !exampleData || !elementId }
          onClick={ onClick }
        >
          Use example data
        </Button>
      </span>
    </Tooltip>
  );
}