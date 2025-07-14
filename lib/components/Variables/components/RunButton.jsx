import React, { useMemo } from 'react';

import { Button, ButtonSkeleton, Tooltip } from '@carbon/react';
import { Chemistry } from '@carbon/icons-react';

import useCamundaContext from '../../../hooks/useCamundaContext';

export default function RunButton({ onClick, error }) {

  const { loading, elementId } = useCamundaContext();

  const tooltipContent = useMemo(() => {
    if (error) {
      return 'Invalid JSON';
    }
    if (!elementId) {
      return 'Select a task on the canvas';
    }
    return null;
  }, [ error, elementId ]);

  if (loading) {
    return (
      <ButtonSkeleton size="sm" className="cds--layout--size-sm" />
    );
  }

  return (
    <Tooltip
      className={ `${tooltipContent ? '' : 'hide-tooltip'}` }
      label={ tooltipContent }
      align="bottom"
      leaveDelayMs={ 100 }>
      <span tabIndex="0" style={ { display: 'inline-block' } }>
        <Button
          onClick={ onClick }
          disabled={ error || !elementId }
          size="sm"
          renderIcon={ Chemistry }>
          Run
        </Button>
      </span>
    </Tooltip>
  );
}