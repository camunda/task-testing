import { useState, useMemo } from 'react';

/**
 * @param {import('../types.d.ts').Element} element
 * @param {import('../types.d.ts').Output} outputProp
 *
 * @returns {{
 *  output: import('../types.d.ts').Output,
 *  setOutput: Function,
 *  outputVariables: import('../types.d.ts').Variables
 * }}
 */
export function useOutput(element, outputProp = {}) {
  const [ output, setOutput ] = useState(outputProp);

  const handleSetOutput = (value) => {
    setOutput({ ...output, [element.id]: value });
  };

  const outputVariables = useMemo(() => {

    return Object.keys(output).reduce((acc, key) => {

      const variables = output[key];

      if (!variables) {
        return acc;
      }

      Object.entries(variables).forEach(([ name, value ]) => {
        acc[name] = { value, source: key };
      });

      return acc;
    }, {});

  }, [ output ]);

  return {
    output: output[element?.id],
    setOutput: handleSetOutput,
    outputVariables
  };
}
