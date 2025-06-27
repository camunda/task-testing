import { useState, useMemo } from 'react';

import { Button, ButtonSkeleton, Link, Tooltip } from '@carbon/react';
import { Chemistry, Launch } from '@carbon/icons-react';

import CodeMirror from '../Codemirror/Codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';

import './Variables.scss';


export default function Variables({ onRun, element, loading }) {

  const [ value, setValue ] = useState('{\n}');
  const [ error, setError ] = useState(false);

  const jsonLinter = () => {
    return (view) => {
      const errors = jsonParseLinter()(view);
      setError(errors.length);
      return errors;
    };
  };

  const tooltipContent = useMemo(() => {
    if (error) {
      return 'Invalid JSON';
    }
    if (!element?.id) {
      return 'Select a task on the canvas';
    }
    return null;
  }, [ error, element ]);

  const handleRun = () => {
    onRun(value);
  };

  return (
    <div className="section variables">
      <div className="section-header variables-header">
        <div className="variables-header_title">
          <div className="variables-header_title-text">
            <span>Input variables</span>
            <Link href="https://docs.camunda.io/docs/components/concepts/variables" renderIcon={ () => <Launch size="14" /> } />
          </div>
          <p className="cds--label">
            {'Enter process variables as JSON. To run a task, select it on the canvas and click Run.'}
          </p>
        </div>
        <div className="variables-header_buttons">
          {loading && <ButtonSkeleton size="sm" className="cds--layout--size-sm" /> }
          {!loading &&
            <Tooltip
              className={ `${tooltipContent ? '' : 'hide-tooltip'}` }
              label={ tooltipContent }
              align="bottom"
              leaveDelayMs={ 100 }>
              <span tabIndex="0" style={ { display: 'inline-block' } }>
                <Button
                  onClick={ handleRun }
                  disabled={ error || !element }
                  size="sm"
                  renderIcon={ Chemistry }
                >
                  Run
                </Button>
              </span>
            </Tooltip>
          }
        </div>
      </div>
      <div className="section-content">
        <CodeMirror
          value={ value }
          extensions={ [ json(), linter(jsonLinter()) ] }
          onChange={ setValue }
        />
      </div>
    </div>
  );
}
