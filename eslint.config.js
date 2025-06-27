import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

const files = {
  ignored: [
    'dist',
    'public'
  ],
  lib: [
    '**/*.js',
    '**/*.jsx',
    '**/*.spec.js',
    '**/*.spec.jsx'
  ],
  build: [
    '*.js'
  ],
  test: [
    'test/**/*.spec.js',
    'test/**/*.spec.jsx'
  ]
};

export default [
  {
    ignores: files.ignored
  },

  // build
  ...bpmnIoPlugin.configs.node.map(config => {
    return {
      ...config,
      files: files.build
    };
  }),

  // lib
  ...bpmnIoPlugin.configs.browser.map(config => {
    return {
      ...config,
      files: files.lib
    };
  }),
  ...bpmnIoPlugin.configs.jsx.map((config) => {
    return {
      ...config,
      files: files.lib
    };
  }),
  {
    settings: {
      react: { version: '18.3.0' }
    },
    files: files.lib,
  },

  // test
  ...bpmnIoPlugin.configs.mocha.map(config => {
    return {
      ...config,
      files: files.test
    };
  }),
];