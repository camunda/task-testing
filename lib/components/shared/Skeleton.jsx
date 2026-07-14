import React from 'react';
import classNames from 'classnames';

/**
 * Skeleton placeholder shown while content is loading.
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS class
 */
export default function Skeleton({ className, ...rest }) {
  return <div className={ classNames('skeleton', className) } { ...rest } />;
}
