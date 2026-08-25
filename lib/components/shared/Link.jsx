import React from 'react';
import classNames from 'classnames';

/**
 * Anchor link styled to match the design system.
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
  target,
  rel,
  className,
  onClick,
  role,
  renderIcon: Icon,
  ...rest
}) {
  const computedRel = rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);

  return (
    <a
      href={ href }
      target={ target }
      rel={ computedRel }
      className={ classNames('link', { 'link--icon': Icon }, className) }
      onClick={ onClick }
      role={ role }
      { ...rest }
    >
      <span className="link__text">{ children }</span>
      { Icon && <Icon className="link__icon" size={ 16 } aria-hidden="true" /> }
    </a>
  );
}
