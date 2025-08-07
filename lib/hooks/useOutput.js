import { useState, useMemo } from 'react';

export function useOutput(element, initialOutput = {}) {
  const [ output, setOutput ] = useState(initialOutput);

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
