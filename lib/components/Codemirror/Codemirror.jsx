import React from 'react';

import './Codemirror.css';

export default function Codemirror({ value, onChange, extensions, ...options }) {
  return (
    <div className="codemirror-wrapper">
      {/* <CodeMirror
        className="codemirror"
        value={ value }
        onChange={ onChange }
        extensions={ extensions }
        height="100%"
        { ...options }
      /> */}
      <textarea
        className="codemirror"
        value={ value }
        onChange={ (e) => onChange(e.target.value) }
        style={ { height: '100%' } }
        { ...options }
      />
    </div>
  );
}