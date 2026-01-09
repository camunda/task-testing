import { renderHook, act } from '@testing-library/react';

import {
  PluginContext,
  usePluginsProviderValue
} from '../../../lib/components/shared/plugins';

describe('plugins', function() {

  describe('PluginContext', function() {

    it('should have default value', function() {

      // then
      expect(PluginContext).to.exist;
    });

  });


  describe('usePluginsProviderValue', function() {

    it('should return plugins provider value', function() {

      // when
      const { result } = renderHook(() => usePluginsProviderValue());

      // then
      expect(result.current.plugins).to.be.an('array');
      expect(result.current.registerPlugin).to.be.a('function');
      expect(result.current.unregisterPlugin).to.be.a('function');
      expect(result.current.getPlugins).to.be.a('function');
    });


    it('should initialize with default value', function() {

      // given
      const defaultPlugins = [
        { slot: 'test-slot', render: () => null, priority: 1 }
      ];

      // when
      const { result } = renderHook(() => usePluginsProviderValue(defaultPlugins));

      // then
      expect(result.current.plugins).to.have.length(1);
      expect(result.current.plugins[0].slot).to.equal('test-slot');
    });


    describe('#registerPlugin', function() {

      it('should register a plugin', function() {

        // given
        const { result } = renderHook(() => usePluginsProviderValue());

        const plugin = { slot: 'test-slot', render: () => null };

        // when
        act(() => {
          result.current.registerPlugin(plugin);
        });

        // then
        expect(result.current.plugins).to.have.length(1);
        expect(result.current.plugins[0]).to.equal(plugin);
      });


      it('should register multiple plugins', function() {

        // given
        const { result } = renderHook(() => usePluginsProviderValue());

        const plugin1 = { slot: 'slot-1', render: () => null };
        const plugin2 = { slot: 'slot-2', render: () => null };

        // when
        act(() => {
          result.current.registerPlugin(plugin1);
          result.current.registerPlugin(plugin2);
        });

        // then
        expect(result.current.plugins).to.have.length(2);
      });

    });


    describe('#unregisterPlugin', function() {

      it('should unregister a plugin', function() {

        // given
        const plugin = { slot: 'test-slot', render: () => null };
        const { result } = renderHook(() => usePluginsProviderValue([ plugin ]));

        // when
        act(() => {
          result.current.unregisterPlugin(plugin);
        });

        // then
        expect(result.current.plugins).to.have.length(0);
      });


      it('should only unregister matching plugin', function() {

        // given
        const plugin1 = { slot: 'slot-1', render: () => null };
        const plugin2 = { slot: 'slot-2', render: () => null };
        const { result } = renderHook(() => usePluginsProviderValue([ plugin1, plugin2 ]));

        // when
        act(() => {
          result.current.unregisterPlugin(plugin1);
        });

        // then
        expect(result.current.plugins).to.have.length(1);
        expect(result.current.plugins[0]).to.equal(plugin2);
      });

    });


    describe('#getPlugins', function() {

      it('should return plugins for a slot', function() {

        // given
        const plugin1 = { slot: 'slot-1', render: () => null };
        const plugin2 = { slot: 'slot-2', render: () => null };
        const { result } = renderHook(() => usePluginsProviderValue([ plugin1, plugin2 ]));

        // when
        const plugins = result.current.getPlugins('slot-1');

        // then
        expect(plugins).to.have.length(1);
        expect(plugins[0]).to.equal(plugin1);
      });


      it('should return empty array for unknown slot', function() {

        // given
        const { result } = renderHook(() => usePluginsProviderValue());

        // when
        const plugins = result.current.getPlugins('unknown-slot');

        // then
        expect(plugins).to.be.an('array');
        expect(plugins).to.have.length(0);
      });


      it('should sort plugins by priority (higher first)', function() {

        // given
        const plugin1 = { slot: 'test-slot', render: () => null, priority: 1 };
        const plugin2 = { slot: 'test-slot', render: () => null, priority: 10 };
        const plugin3 = { slot: 'test-slot', render: () => null, priority: 5 };
        const { result } = renderHook(() => usePluginsProviderValue([ plugin1, plugin2, plugin3 ]));

        // when
        const plugins = result.current.getPlugins('test-slot');

        // then
        expect(plugins).to.have.length(3);
        expect(plugins[0].priority).to.equal(10);
        expect(plugins[1].priority).to.equal(5);
        expect(plugins[2].priority).to.equal(1);
      });


      it('should handle plugins without priority', function() {

        // given
        const plugin1 = { slot: 'test-slot', render: () => null };
        const plugin2 = { slot: 'test-slot', render: () => null, priority: 5 };
        const { result } = renderHook(() => usePluginsProviderValue([ plugin1, plugin2 ]));

        // when
        const plugins = result.current.getPlugins('test-slot');

        // then
        expect(plugins).to.have.length(2);
        expect(plugins[0].priority).to.equal(5);
        expect(plugins[1].priority).to.be.undefined;
      });

    });

  });

});
