import React, { useMemo } from 'react';

import { CodeSnippet, InlineLoading } from '@carbon/react';


export default function Output({ output, running }) {
  const error = useMemo(() => {
    return output instanceof Error;
  }, [ output ]);

  const value = useMemo(() => {
    if (error) {
      return output.message;
    }

    return JSON.stringify(output.variables, null, 2);
  }, [ output, error ]);

  const status = useMemo(() => {
    if (running) {
      return (
        <InlineLoading
          description="Running task..."
          iconDescription="Running task..."
        />
      );
    }

    if (error) {
      return <div>Task executions failed</div>;
    }

    if (output) {
      return <div>Task completed with variables:</div>;
    }

    return <div>No output</div>;
  }, [ running, output, error ]);

  return (
    <div className="section">
      <div className="section__header">
        <div className="section__header--title">
          <p>Output variables</p>
          <p className="cds--label">
            {'Run a task to see what output variables it executed with.'}
          </p>
        </div>
      </div>
      <div className="section__content output">
        <div className="status">
          { status}
        </div>
        <div className="result">
          {value && !running && <CodeSnippet
            className="snippet"
            type="multi"
            align="left"
            feedback="Copied"
            copyButtonDescription="Copy"
          >
            {value}
          </CodeSnippet>}
        </div>
      </div>
    </div>
  );
}