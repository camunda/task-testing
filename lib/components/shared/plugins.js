import { createContext, useCallback, useState } from 'react';

/**
 * @typedef {Object} Plugin
 * @property {string} slot - The plugin point identifier
 * @property {Function} render - Function that renders the component
 * @property {number} [priority] - Priority for sorting (higher values first)
 * @property {string} [label] - Label for the plugin
 */

/**
 * @typedef {Object} PluginContextValue
 * @property {Plugin[]} plugins - Array of registered plugins
 * @property {(plugin: Plugin) => void} registerPlugin - Register a plugin
 * @property {(plugin: Plugin) => void} unregisterPlugin - Unregister a plugin
 * @property {(pluginPoint: string) => Plugin[]} getPlugins - Get plugins by slot
 */

/** @type {PluginContextValue} */
const defaultContextValue = {
  plugins: [],
  registerPlugin: (plugin) => {},
  unregisterPlugin: (plugin) => {},
  getPlugins: (pluginPoint) => []
};

export const PluginContext = createContext(defaultContextValue);

/**
 * Hook to create the plugin provider value
 * @param {Plugin[]} [defaultValue=[]] - Initial plugins
 * @returns {PluginContextValue}
 */
export const usePluginsProviderValue = (defaultValue = []) => {
  const [ plugins, setPlugins ] = useState(defaultValue);

  const registerPlugin = useCallback((plugin) => {
    setPlugins((prevPlugins) => [ ...prevPlugins, plugin ]);
  }, []);

  const unregisterPlugin = useCallback((plugin) => {
    setPlugins((prevPlugins) =>
      prevPlugins.filter((p) => p !== plugin)
    );
  }, []);

  const getPlugins = useCallback((pluginPoint) => {
    return plugins
      .filter((plugin) => plugin.slot === pluginPoint)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)); // Higher priority first
  }, [ plugins ]);


  return {
    plugins,
    registerPlugin,
    unregisterPlugin,
    getPlugins
  };
};
