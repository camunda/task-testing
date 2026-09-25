import React from 'react';
import classNames from 'classnames';

import {
  Tooltip as DSTooltip,
  TooltipContent,
  TooltipTrigger
} from '@camunda/design-system';

/**
 * @typedef {'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'} TooltipAlign
 */

// spacing and text size of the design system's DefinitionTooltip, which fits sentences better than the label-sized Tooltip
export const TOOLTIP_CONTENT_CLASS = 'task-testing-tooltip px-3 py-2 text-sm';

/**
 * Design system tooltip that accepts rich content, including links.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.label - Tooltip content
 * @param {React.ReactNode} props.children - Trigger element(s)
 * @param {TooltipAlign} [props.align='bottom-start'] - Tooltip alignment
 * @param {string} [props.className] - Additional CSS class for the trigger wrapper
 */
export default function Tooltip({
  label,
  children,
  align = 'bottom-start',
  className
}) {
  const [ side, alignment ] = /** @type {['bottom'|'top', 'start'|'end']} */ (align.split('-'));

  return (
    <DSTooltip>
      <TooltipTrigger asChild>
        <span className={ classNames('task-testing-tooltip__trigger', className) }>
          { children }
        </span>
      </TooltipTrigger>
      <TooltipContent side={ side } align={ alignment } className={ TOOLTIP_CONTENT_CLASS }>
        { label }
      </TooltipContent>
    </DSTooltip>
  );
}
