import React, { useMemo, useState } from 'react';

import { Button, ButtonSkeleton, Tooltip } from '@carbon/react';

export default function RunButton({ onClick, error }) {

  const [ loading, setLoading ] = useState(false);

  const tooltipContent = useMemo(() => {
    if (error) {
      return 'Invalid JSON';
    }
    return null;
  }, [ error ]);

  const handleClick = () => {
    if (onClick) {
      setLoading(true);
      onClick().finally(() => setLoading(false));
    }
  };

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
          onClick={ handleClick }
          disabled={ error }
          size="sm"
        >
          Run this task
        </Button>
      </span>
    </Tooltip>
  );
}