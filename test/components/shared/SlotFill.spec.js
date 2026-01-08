import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import {
  createFillsManager,
  FillsContext,
  Fill,
  Slot
} from '../../../lib/components/shared/SlotFill';

describe('SlotFill', function() {

  describe('createFillsManager', function() {

    it('should create a fills manager', function() {

      // when
      const manager = createFillsManager();

      // then
      expect(manager).to.exist;
      expect(manager.getFills).to.be.a('function');
      expect(manager.register).to.be.a('function');
      expect(manager.unregister).to.be.a('function');
      expect(manager.subscribe).to.be.a('function');
    });


    it('should register a fill provider', function() {

      // given
      const manager = createFillsManager();
      const fillProvider = { slot: 'test', priority: 10, getFill: () => 'content' };

      // when
      manager.register(fillProvider);

      // then
      expect(manager.getFills()).to.have.length(1);
      expect(manager.getFills()[0]).to.equal(fillProvider);
    });


    it('should unregister a fill provider', function() {

      // given
      const manager = createFillsManager();
      const fillProvider = { slot: 'test', priority: 10, getFill: () => 'content' };
      manager.register(fillProvider);

      // when
      manager.unregister(fillProvider);

      // then
      expect(manager.getFills()).to.have.length(0);
    });


    it('should notify subscribers on register', function() {

      // given
      const manager = createFillsManager();
      const fillProvider = { slot: 'test', priority: 10, getFill: () => 'content' };
      const listener = sinon.spy();
      manager.subscribe(listener);

      // when
      manager.register(fillProvider);

      // then
      expect(listener).to.have.been.calledOnce;
      expect(listener).to.have.been.calledWith([ fillProvider ]);
    });


    it('should notify subscribers on unregister', function() {

      // given
      const manager = createFillsManager();
      const fillProvider = { slot: 'test', priority: 10, getFill: () => 'content' };
      manager.register(fillProvider);
      const listener = sinon.spy();
      manager.subscribe(listener);

      // when
      manager.unregister(fillProvider);

      // then
      expect(listener).to.have.been.calledOnce;
      expect(listener).to.have.been.calledWith([]);
    });


    it('should unsubscribe', function() {

      // given
      const manager = createFillsManager();
      const listener = sinon.spy();
      const unsubscribe = manager.subscribe(listener);

      // when
      unsubscribe();
      manager.register({ slot: 'test', priority: 10, getFill: () => 'content' });

      // then
      expect(listener).to.not.have.been.called;
    });

  });


  describe('Fill', function() {

    it('should register fill on mount', async function() {

      // given
      const manager = createFillsManager();
      const getFill = () => ({ content: <span>Test Content</span> });

      // when
      render(
        <FillsContext.Provider value={ manager }>
          <Fill slot="test-slot" priority={ 5 } getFill={ getFill } />
        </FillsContext.Provider>
      );

      // then
      await waitFor(() => {
        expect(manager.getFills()).to.have.length(1);
        expect(manager.getFills()[0].slot).to.equal('test-slot');
        expect(manager.getFills()[0].priority).to.equal(5);
      });
    });


    it('should unregister fill on unmount', async function() {

      // given
      const manager = createFillsManager();
      const getFill = () => ({ content: <span>Test Content</span> });

      const { unmount } = render(
        <FillsContext.Provider value={ manager }>
          <Fill slot="test-slot" getFill={ getFill } />
        </FillsContext.Provider>
      );

      await waitFor(() => {
        expect(manager.getFills()).to.have.length(1);
      });

      // when
      unmount();

      // then
      expect(manager.getFills()).to.have.length(0);
    });


    it('should handle missing context gracefully', function() {

      // when
      const { container } = render(
        <Fill slot="test-slot" getFill={ () => ({ content: 'test' }) } />
      );

      // then
      expect(container).to.exist;
    });

  });


  describe('Slot', function() {

    it('should render fills for matching slot name', async function() {

      // given
      const manager = createFillsManager();

      // when
      render(
        <FillsContext.Provider value={ manager }>
          <Fill
            slot="my-slot"
            getFill={ () => <span data-testid="fill-content">Hello</span> }
          />
          <Slot name="my-slot" />
        </FillsContext.Provider>
      );

      // then
      await screen.findByTestId('fill-content');
      expect(screen.getByText('Hello')).to.exist;
    });


    it('should not render fills for non-matching slot name', async function() {

      // given
      const manager = createFillsManager();

      // when
      render(
        <FillsContext.Provider value={ manager }>
          <Fill
            slot="other-slot"
            getFill={ () => <span data-testid="fill-content">Hello</span> }
          />
          <Slot name="my-slot" />
        </FillsContext.Provider>
      );

      // then
      await waitFor(() => {
        expect(screen.queryByTestId('fill-content')).to.not.exist;
      });
    });


    it('should sort fills by priority (high priority first)', async function() {

      // given
      const manager = createFillsManager();

      // when
      render(
        <FillsContext.Provider value={ manager }>
          <Fill
            slot="my-slot"
            priority={ 10 }
            getFill={ () => <span>Low</span> }
          />
          <Fill
            slot="my-slot"
            priority={ 100 }
            getFill={ () => <span>High</span> }
          />
          <Fill
            slot="my-slot"
            priority={ 50 }
            getFill={ () => <span>Medium</span> }
          />
          <Slot name="my-slot" />
        </FillsContext.Provider>
      );

      // then
      await waitFor(() => {
        const container = document.body;
        const text = container.textContent;
        const highIndex = text.indexOf('High');
        const mediumIndex = text.indexOf('Medium');
        const lowIndex = text.indexOf('Low');

        expect(highIndex).to.be.lessThan(mediumIndex);
        expect(mediumIndex).to.be.lessThan(lowIndex);
      });
    });


    it('should filter out null/undefined fills', async function() {

      // given
      const manager = createFillsManager();

      // when
      render(
        <FillsContext.Provider value={ manager }>
          <Fill
            slot="my-slot"
            getFill={ () => null }
          />
          <Fill
            slot="my-slot"
            getFill={ () => <span data-testid="visible">Visible</span> }
          />
          <Fill
            slot="my-slot"
            getFill={ () => undefined }
          />
          <Slot name="my-slot" />
        </FillsContext.Provider>
      );

      // then
      await screen.findByTestId('visible');
      expect(screen.getByText('Visible')).to.exist;
    });


    it('should pass props to getFill function', async function() {

      // given
      const manager = createFillsManager();
      const getFillSpy = sinon.spy(() => <span>Content</span>);

      // when
      render(
        <FillsContext.Provider value={ manager }>
          <Fill slot="my-slot" getFill={ getFillSpy } />
          <Slot name="my-slot" customProp="customValue" anotherProp={ 42 } />
        </FillsContext.Provider>
      );

      // then
      await waitFor(() => {
        expect(getFillSpy).to.have.been.called;
        const callArgs = getFillSpy.lastCall.args[0];
        expect(callArgs.customProp).to.equal('customValue');
        expect(callArgs.anotherProp).to.equal(42);
      });
    });


    it('should use custom RenderIn component', async function() {

      // given
      const manager = createFillsManager();
      const CustomRenderer = ({ fills }) => (
        <div data-testid="custom-renderer">
          <span>Custom: {fills.length} fills</span>
          {fills.map((fill, index) => (
            <React.Fragment key={ index }>{fill}</React.Fragment>
          ))}
        </div>
      );

      // when
      render(
        <FillsContext.Provider value={ manager }>
          <Fill slot="my-slot" getFill={ () => <span>Fill 1</span> } />
          <Fill slot="my-slot" getFill={ () => <span>Fill 2</span> } />
          <Slot name="my-slot" RenderIn={ CustomRenderer } />
        </FillsContext.Provider>
      );

      // then
      await screen.findByTestId('custom-renderer');
      expect(screen.getByText('Custom: 2 fills')).to.exist;
    });


    it('should handle missing context gracefully', function() {

      // when
      const { container } = render(
        <Slot name="my-slot" />
      );

      // then
      expect(container).to.exist;
    });

  });

});
