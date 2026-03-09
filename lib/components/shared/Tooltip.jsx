import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * @typedef {'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'} TooltipAlign
 */

/**
 * Lightweight tooltip component.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.label - Tooltip content
 * @param {React.ReactNode} props.children - Trigger element(s)
 * @param {TooltipAlign} [props.align='bottom-start'] - Tooltip alignment
 * @param {string} [props.className] - Additional CSS class for the wrapper
 * @param {number} [props.showDelay=250] - Delay in ms before showing
 * @param {number} [props.hideDelay=250] - Delay in ms before hiding
 */
export default function Tooltip({
  label,
  children,
  align = 'bottom-start',
  className,
  showDelay = 250,
  hideDelay = 250
}) {
  const [ visible, setVisible ] = useState(false);

  /** @type {React.MutableRefObject<ReturnType<typeof setTimeout>|undefined>} */
  const showTimeoutRef = useRef(undefined);

  /** @type {React.MutableRefObject<ReturnType<typeof setTimeout>|undefined>} */
  const hideTimeoutRef = useRef(undefined);

  /** @type {React.MutableRefObject<HTMLDivElement|null>} */
  const wrapperRef = useRef(null);

  /** @type {React.MutableRefObject<HTMLDivElement|null>} */
  const tooltipRef = useRef(null);

  const show = useCallback((delay = false) => {
    clearTimeout(showTimeoutRef.current);
    clearTimeout(hideTimeoutRef.current);

    if (delay) {
      showTimeoutRef.current = setTimeout(() => {
        setVisible(true);
      }, showDelay);
    } else {
      setVisible(true);
    }
  }, [ showDelay ]);

  const hide = useCallback((delay = false) => {
    clearTimeout(showTimeoutRef.current);
    clearTimeout(hideTimeoutRef.current);

    if (delay) {
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, hideDelay);
    } else {
      setVisible(false);
    }
  }, [ hideDelay ]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target)
      ) {
        hide(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ visible, hide ]);

  const handleMouseEnter = () => show(true);

  const handleMouseLeave = ({ relatedTarget }) => {

    // Don't hide when moving between wrapper and tooltip
    if (
      relatedTarget === wrapperRef.current ||
      relatedTarget === tooltipRef.current ||
      wrapperRef.current?.contains(relatedTarget) ||
      tooltipRef.current?.contains(relatedTarget)
    ) {
      return;
    }

    // Keep open during text selection within tooltip
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      try {
        const selectionRange = selection.getRangeAt(0);
        if (
          tooltipRef.current?.contains(selectionRange.commonAncestorContainer) ||
          tooltipRef.current?.contains(selection.anchorNode) ||
          tooltipRef.current?.contains(selection.focusNode)
        ) {
          return;
        }
      } catch (e) {

        // getRangeAt may throw if there's no range
      }
    }

    hide(true);
  };

  const handleTooltipMouseEnter = () => {
    clearTimeout(hideTimeoutRef.current);
  };

  const handleFocusOut = (e) => {
    const { relatedTarget } = e;

    if (
      tooltipRef.current?.contains(relatedTarget) ||
      wrapperRef.current?.contains(relatedTarget)
    ) {
      return;
    }

    hide(false);
  };

  const handleKeyDown = (e) => {
    if (e.code === 'Escape') {
      hide(false);
    }
  };

  const renderTooltip = () => {
    const position = getTooltipPosition(wrapperRef.current, align);

    return (
      <div
        className={ `task-testing-tooltip ${align}` }
        role="tooltip"
        style={ position }
        ref={ tooltipRef }
        onClick={ (e) => e.stopPropagation() }
        onMouseEnter={ handleTooltipMouseEnter }
        onMouseLeave={ handleMouseLeave }
      >
        <div className="task-testing-tooltip__content">
          { label }
        </div>
        <div className="task-testing-tooltip__arrow" />
      </div>
    );
  };

  const handleFocus = (e) => {

    // Only show tooltip when the wrapper itself receives focus,
    // not when focus moves to a child element (e.g. a button)
    if (e.target === wrapperRef.current) {
      show(false);
    }
  };

  return (
    <div
      className={ `task-testing-tooltip__wrapper${className ? ` ${className}` : ''}` }
      ref={ wrapperRef }
      onMouseEnter={ handleMouseEnter }
      onMouseLeave={ handleMouseLeave }
      onFocus={ handleFocus }
      onBlur={ handleFocusOut }
      onKeyDown={ handleKeyDown }
    >
      { children }
      { visible && createPortal(renderTooltip(), document.body) }
    </div>
  );
}


// helpers //////////////////////

/**
 * Calculate tooltip position based on alignment and trigger element.
 *
 * @param {HTMLElement|null} triggerElement
 * @param {TooltipAlign} align
 * @returns {React.CSSProperties}
 */
function getTooltipPosition(triggerElement, align) {
  if (!triggerElement) return {};

  const rect = triggerElement.getBoundingClientRect();
  const style = {};

  if (align.startsWith('bottom')) {
    style.top = rect.bottom + 6;
  } else if (align.startsWith('top')) {
    style.bottom = window.innerHeight - rect.top + 6;
  }

  if (align.endsWith('start')) {
    style.left = rect.left;
  } else if (align.endsWith('end')) {
    style.right = window.innerWidth - rect.right;
  }

  return style;
}
