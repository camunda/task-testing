import React, { useState } from 'react';

import { Button, ButtonSkeleton, Tooltip } from '@carbon/react';

/**
 * Carbon React Button wrapped in a tooltip.
 *
 * Displays a loading skeleton if `skeleton` prop is true and `onClick` returns a promise.
 */
export default function CustomButton({ children, onClick, kind, tooltip, skeleton }) {

  const [ loading, setLoading ] = useState(false);

  const handleClick = () => {
    setLoading(true);
    onClick()?.finally(() => setLoading(false));
  };

  if (loading && skeleton) {
    return (
      <ButtonSkeleton size="sm" className="cds--layout--size-sm" />
    );
  }

  return (
    <Tooltip
      className={ `${tooltip ? '' : 'hide-tooltip'}` }
      label={ tooltip }
      align="bottom"
      leaveDelayMs={ 100 }>
      <span tabIndex="0" style={ { display: 'inline-block' } }>
        <Button
          kind={ kind }
          onClick={ handleClick }
          size="sm"
        >
          { children }
        </Button>
      </span>
    </Tooltip>
  );
}