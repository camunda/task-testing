import CodeMirror from '@uiw/react-codemirror';

import './Codemirror.scss';

export default function Codemirror({ value, onChange, extensions, ...options }) {
  return (
    <div className="codemirror-wrapper">
      <CodeMirror
        className="codemirror"
        value={ value }
        onChange={ onChange }
        extensions={ extensions }
        height="100%"
        { ...options }
      />
    </div>
  );
}