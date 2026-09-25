import React from 'react';
import classNames from 'classnames';
import { Loader2 } from '@camunda/design-system/icons';

/**
 * Inline loading spinner.
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS class
 * @param {number} [props.size=16] - Icon size in pixels
 */
export default function Spinner({ className, size = 16, ...rest }) {
  return (
    <Loader2
      className={ classNames('spinner animate-spin', className) }
      size={ size }
      role="status"
      aria-label="Loading"
      { ...rest }
    />
  );
}
