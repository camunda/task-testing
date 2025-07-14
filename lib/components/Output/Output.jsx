import React, { useMemo, useState } from 'react';

import { Button } from '@carbon/react';

import CodeEditor from '../CodeEditor/CodeEditor';

import useCamundaContext from '../../hooks/useCamundaContext';

export default function Output() {

  const [ copyResultText, setCopyResultText ] = useState('Copy result');

  const { log } = useCamundaContext();

  const value = useMemo(() => {
    if (!log.length) {
      return '';
    }

    return log.map(({ elementId, message, type }) => {
      if (type === 'info') {
        return `${elementId}: ${message}`;
      } else {
        return message;
      }
    }).join('\n');
  }, [ log ]);

  const copyResult = () => {
    const latestResult = [ ...log ].reverse().find(item => item.type === 'result');
    if (latestResult) {
      navigator.clipboard.writeText(latestResult.message);
      setCopyResultText('Copied!');
      setTimeout(() => {
        setCopyResultText('Copy result');
      }, 2000);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-header__info">
          <p>Activity log</p>
          <p className="cds--label">
            {'Log of the task execution. If you run a task, the output will be displayed here.'}
          </p>
        </div>
        <div className="section-header__buttons">
          <Button
            kind="tertiary"
            size="sm"
            onClick={ copyResult }
            disabled={ !log.length }
          >
            {copyResultText}
          </Button>
        </div>
      </div>
      <div className="editor">
        <CodeEditor
          value={ value }
          readOnly={ true }
          linting={ false }
          placeholder="No output yet"
        />
      </div>
    </div>
  );
}