import React from 'react';

import { CamundaProvider } from './context/CamundaContext';

import Output from './components/Output';
import Variables from './components/Variables';

import './style.scss';

/**
 * @param {Object} props
 * @returns {import('react').ReactElement}
 */
export default function TaskTesting(props) {

  const {
    injector,
    deploy,
    startInstance,
    getInstance
  } = props;

  const camundaApi = { deploy, startInstance, getInstance };

  return (
    <CamundaProvider injector={ injector } camundaApi={ camundaApi }>
      <div className="task-testing__container">
        <Variables />
        <Output />
      </div>
    </CamundaProvider>
  );
}