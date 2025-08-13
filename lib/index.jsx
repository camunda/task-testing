import React, { useCallback, useEffect, useState } from 'react';

import { useSelectedElement } from './hooks/useSelectedElement';

import { ElementConfig } from './ElementConfig';
import { ElementVariables } from './ElementVariables';

import Input from './components/Input/Input';
import Output from './components/Output/Output';

import run from './utils/run-task';

import './style/style.scss';

/**
 * @param {Object} props
 * @returns {import('react').ReactElement}
 */
export default function TaskTesting({
  injector,
  deploy,
  startInstance,
  getInstance,
  config = {},
  onConfigChanged = () => {}
}) {
  const [ running, setRunning ] = useState(false);

  const element = useSelectedElement(injector);

  const [ elementVariables, setElementVariables ] = useState(null);

  const [ variablesForElement, setVariablesForElement ] = useState([]);

  const [ elementConfig, setElementConfig ] = useState(null);

  const [ input, setInput ] = useState('{}');
  const [ output, setOutput ] = useState({});

  useEffect(() => {
    const elementVariables = new ElementVariables(injector);

    const elementConfig = new ElementConfig(injector, elementVariables, config);

    setElementVariables(elementVariables);

    setElementConfig(elementConfig);
  }, []);

  useEffect(() => {
    const onVariablesChanged = async () => {
      if (element && elementVariables) {
        const variables = await elementVariables.getVariablesForElement(element);
        setVariablesForElement(variables);
      }
    };

    if (elementVariables) {
      elementVariables.on('variables.changed', onVariablesChanged);

      if (element) {
        onVariablesChanged();
      }
    }

    return () => {
      if (elementVariables) {
        elementVariables.off('variables.changed', onVariablesChanged);
      }
    };
  }, [ element, elementVariables ]);

  useEffect(() => {
    const onConfigChanged = () => {
      if (element && elementConfig) {
        elementConfig.getInputConfigForElement(element).then((inputConfig) => {
          setInput(inputConfig);
          setOutput(elementConfig.getOutputConfigForElement(element));
        });
      }
    };

    if (elementConfig) {
      elementConfig.on('config.changed', onConfigChanged);

      onConfigChanged();
    }

    return () => {
      if (elementConfig) {
        elementConfig.off('config.changed', onConfigChanged);
      }
    };
  }, [ element, elementConfig ]);

  useEffect(() => {
    if (elementConfig) {
      if (JSON.stringify(config) !== JSON.stringify(elementConfig.getConfig())) {
        elementConfig.setConfig(config);
      }
    }
  }, [ config, elementConfig ]);

  const onSetInput = useCallback((newInput) => {
    if (element && elementConfig) {
      elementConfig.setInputConfigForElement(element, newInput);
    }
  }, [ element, elementConfig ]);

  const onResetInput = useCallback(() => {
    if (element && elementConfig) {
      elementConfig.resetInputConfigForElement(element);
    }
  }, [ element, elementConfig ]);

  const handleRunTask = async () => {
    setRunning(true);

    const camundaApi = { deploy, startInstance, getInstance };

    const input = elementConfig.getInputConfigForElement(element);

    try {
      const result = await run(element.id, input, camundaApi);

      elementConfig.setOutputConfigForElement(element, result);

      onConfigChanged({
        ...config,
        output: {
          ...config.output,
          [element.id]: result
        }
      });
    } catch (error) {
      elementConfig.setOutputConfigForElement(element, error);
    } finally {
      setRunning(false);
    }
  };

  if (!element) {
    return (
      <div className="task-testing__container">
        <div className="empty">
          <p>Select a single task on the canvas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-testing__container">
      <Input
        element={ element }
        input={ input }
        output={ output }
        setInput={ onSetInput }
        resetInput={ onResetInput }
        variablesForElement={ variablesForElement }
        onRunTask={ handleRunTask }
      />
      <Output
        output={ output }
        running={ running }
      />
    </div>
  );
}
