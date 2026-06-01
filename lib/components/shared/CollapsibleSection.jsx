import React, { useEffect, useRef, useState } from 'react';

import {
  ChevronDown,
  ChevronRight
} from '@carbon/icons-react';

import Tooltip from './Tooltip';

/**
 * A collapsible section with a sticky header. Works in both uncontrolled mode
 * (manages its own open state via `defaultOpen`) and controlled mode (when
 * `open` is provided, the consumer owns the state and is notified via
 * `onToggle`).
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {React.ReactNode} [props.tooltip]
 * @param {boolean} [props.defaultOpen] - Initial open state when uncontrolled.
 * @param {boolean} [props.open] - Controlled open state. When provided, the
 * component is controlled and `onToggle` is called on header clicks.
 * @param {(open: boolean) => void} [props.onToggle] - Called with the next open
 * state when the header is clicked (controlled mode).
 * @param {boolean} [props.isExecuting]
 * @param {string} [props.collapsedHint]
 * @param {React.ReactNode} props.children
 */
export default function CollapsibleSection({ title, tooltip, defaultOpen = true, open, onToggle, isExecuting = false, collapsedHint, children }) {
  const isControlled = open !== undefined;

  const [ internalOpen, setInternalOpen ] = useState(defaultOpen);

  const isOpen = isControlled ? open : internalOpen;

  const [ isStuck, setIsStuck ] = useState(false);

  /** @type {React.MutableRefObject<HTMLDivElement|null>} */
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const scrollParent = el.closest('.task-testing-tabs__panel') || el.closest('.task-testing__container--body-executing');
    if (!scrollParent) return;

    const observer = new IntersectionObserver(
      ([ entry ]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { root: scrollParent, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.(!isOpen);
    } else {
      setInternalOpen(!isOpen);
    }
  };

  return (
    <div className={ `output__collapsible${isOpen ? ' output__collapsible--open' : ''}` }>
      <div ref={ sentinelRef } className="output__collapsible-sentinel" />
      <button
        className={ `output__collapsible-header${isStuck ? ' stuck' : ''}` }
        onClick={ handleToggle }
      >
        {
          isOpen ? <ChevronDown size={ 16 } className="output__chevron output__chevron--open" />
            : <ChevronRight size={ 16 } className="output__chevron" />
        }
        { tooltip ? (
          <Tooltip className="has-tooltip" label={ tooltip } align="bottom-start">
            <span className="output__collapsible-title">{ title }</span>
          </Tooltip>
        ) : (
          <span className="output__collapsible-title">{ title }</span>
        ) }
        { !isOpen && collapsedHint && (
          <span className="output__collapsible-hint">{ collapsedHint }</span>
        ) }
      </button>
      { isOpen && (
        <div className="output__collapsible-content">
          { children }
        </div>
      ) }
    </div>
  );
}
