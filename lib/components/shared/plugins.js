import { createContext, useCallback, useState } from 'react';

/**
 * @typedef {import('../../types').Plugin} Plugin
 * @typedef {import('../../types').PluginContextValue} PluginContextValue
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
 * Hook to create the plugin provider value.
 *
 * @param {Plugin[]} [defaultValue=[]] - Initial plugins
 *
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

  const getPlugins = useCallback((type) => {
    return plugins
      .filter((plugin) => plugin.type === type)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)); // Higher priority first
  }, [ plugins ]);


  return {
    plugins,
    registerPlugin,
    unregisterPlugin,
    getPlugins
  };
};
