import React, { useMemo } from 'react';

import CodeMirror from '../Codemirror/Codemirror';
import { json } from '@codemirror/lang-json';

import './Output.css';

export default function Output({ log }) {

  const value = useMemo(() => {
    if (!log.length) {
      return '';
    }

    return log.map((entry) => {
      return `${entry.elementId}: ${entry.message}`;
    }).join('\n');
  }, [ log ]);

  return (
    <div className="section output">
      <div className="output-header section-header">
        <p>Activity log</p>
        <p className="cds--label">
          {'Log of the task execution. If you run a task, the output will be displayed here.'}
        </p>
      </div>
      <div className="section-content">
        <CodeMirror
          value={ value }
          extensions={ [ json() ] }
          readOnly={ true }
        />
      </div>
    </div>
  );
}