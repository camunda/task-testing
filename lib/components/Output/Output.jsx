import React, { useMemo } from 'react';

import { CodeSnippet, InlineLoading } from '@carbon/react';

// import './Output.scss';

export default function Output({ output, loading }) {

  const value = useMemo(() => {
    if (output instanceof Error) {
      return output.message;
    }
    return JSON.stringify(output, null, 2);
  }, [ output ]);

  const error = useMemo(() => {
    return output instanceof Error;
  }, [ output ]);

  const status = useMemo(() => {
    if (loading) {
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
  }, [ loading, output, error ]);

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
          {value && !loading && <CodeSnippet
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