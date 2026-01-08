import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * @typedef {'output' | 'output_header_actions'} SlotName
 */

/**
 * @typedef {Object} OutputSlotProps
 * @property {import('bpmn-js/lib/model/Types').Element} element
 * @property {import('../../types').ElementOutput} output
 * @property {boolean} isTaskExecuting
 */

/**
 * @typedef {Object} OutputHeaderActionsSlotProps
 * @property {import('bpmn-js/lib/model/Types').Element} element
 * @property {import('../../types').ElementOutput} output
 * @property {boolean} isTaskExecuting
 * @property {boolean} isConnectionConfigured
 * @property {string|undefined} currentOperateUrl
 * @property {Function} onResetOutput
 */

/**
 * @typedef {Object} OutputTabFill
 * @property {string} label
 * @property {React.ReactNode} content
 */

/**
 * @callback OutputSlotGetFill
 * @param {OutputSlotProps} props
 * @returns {OutputTabFill | undefined}

/**
 * @callback OutputHeaderActionsSlotGetFill
 * @param {OutputHeaderActionsSlotProps} props
 * @returns {React.ReactNode | undefined}
 */

/**
 * @typedef {Object} OutputFillProvider
 * @property {'output'} slot
 * @property {number} priority
 * @property {OutputSlotGetFill} getFill
 * @property {string} [id]
 */

/**
 * @typedef {Object} OutputHeaderActionsFillProvider
 * @property {'output_header_actions'} slot
 * @property {number} priority
 * @property {OutputHeaderActionsSlotGetFill} getFill
 * @property {string} [id]
 */

/**
 * @typedef {OutputFillProvider | OutputHeaderActionsFillProvider} FillProvider
 */

/**
 * @typedef {Object} FillsManager
 * @property {() => FillProvider[]} getFills
 * @property {(fillProvider: FillProvider) => void} register
 * @property {(fillProvider: FillProvider) => void} unregister
 * @property {(listener: (fills: FillProvider[]) => void) => () => void} subscribe
 */

/**
 * Creates a FillsManager to handle dynamic registration/unregistration of Fills
 * with proper React state updates to trigger re-renders.
 * @returns {FillsManager}
 */
export function createFillsManager() {

  /** @type {FillProvider[]} */
  let fills = [];

  /** @type {((fills: FillProvider[]) => void)[]} */
  let listeners = [];

  return {
    getFills() {
      return fills;
    },
    register(fillProvider) {
      fills = [ ...fills, fillProvider ];
      listeners.forEach(listener => listener(fills));
    },
    unregister(fillProvider) {
      fills = fills.filter(f => f !== fillProvider);
      listeners.forEach(listener => listener(fills));
    },
    subscribe(listener) {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(l => l !== listener);
      };
    }
  };
}

/** @type {React.Context<FillsManager | null>} */
export const FillsContext = createContext(/** @type {FillsManager | null} */ (null));

export const Fill = function({ slot, priority = 10, getFill }) {
  const fillsManager = useContext(FillsContext);

  const fillProvider = useMemo(() => {
    return { slot, priority, getFill };
  }, [ slot, priority, getFill ]);

  useEffect(() => {
    if (!fillsManager) {
      return;
    }

    fillsManager.register(fillProvider);

    return () => {
      fillsManager.unregister(fillProvider);
    };
  }, [ fillsManager, fillProvider ]);

  return null;
};

export const Slot = function({ name, RenderIn = DefaultSlotComponent, ...props }) {
  const fillsManager = useContext(FillsContext);
  const [ fills, setFills ] = useState(() => fillsManager?.getFills() || []);

  useEffect(() => {
    if (!fillsManager) {
      return;
    }

    // Set initial fills
    setFills(fillsManager.getFills());

    // Subscribe to changes
    return fillsManager.subscribe(setFills);
  }, [ fillsManager ]);

  const providers = useMemo(() => {
    return fills.filter(fill => fill.slot === name).sort((a, b) => b.priority - a.priority); // High priority first
  }, [ fills, name ]);

  return (<RenderIn fills={ providers.map((provider) => {
    return provider.getFill(/** @type {any} */ (props));
  }).filter(Boolean) } />);
};

const DefaultSlotComponent = ({ fills }) => {
  return <>
    {fills.map((fill, index) => (
      <React.Fragment key={ index }>
        { fill }
      </React.Fragment>
    ))}
  </>;
};