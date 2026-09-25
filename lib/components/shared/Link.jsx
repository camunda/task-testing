import React from 'react';

import { Link as DSLink } from '@camunda/design-system';

/**
 * Design system link with an optional trailing icon. Renders disabled when it
 * has neither `href` nor `onClick`.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Link content
 * @param {string} [props.href] - Link URL
 * @param {string} [props.target] - Link target
 * @param {string} [props.rel] - Link relationship
 * @param {string} [props.className] - Additional CSS class
 * @param {React.MouseEventHandler<HTMLAnchorElement>} [props.onClick] - Click handler
 * @param {string} [props.role] - ARIA role
 * @param {React.ComponentType<any>} [props.renderIcon] - Trailing icon component
 */
export default function Link({
  children,
  href,
  onClick,
  renderIcon: Icon,
  ...rest
}) {
  return (
    <DSLink href={ href } onClick={ onClick } disabled={ !href && !onClick } { ...rest }>
      <span className="link__text">{ children }</span>
      { Icon && <Icon aria-hidden="true" /> }
    </DSLink>
  );
}
