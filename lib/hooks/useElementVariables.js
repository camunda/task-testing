import { useVariableResolver } from './useVariableResolver';

/**
 * Get all process variables available for a given element based on the provided config.
 * Resolved variables are cached until diagram is modified.
 *
 * @param {*} injector
 * @param {import("../types").BpmnElement} element
 * @param {import("../ElementConfig").ElementConfig} elementConfig
 *
 * @return {import("../types").Variables}
 */
export function useElementVariables(injector, element, elementConfig) {

  const resolvedVariables = useVariableResolver(injector, element);

  return {
    ...elementConfig.getOutputVariables(),
    ...resolvedVariables
  };
}