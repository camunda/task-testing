// Will be fetched remotely in a real world scenario
import logHtml from './log.html';

export const rpaPlugins = [
  {
    slot: 'output',
    priority: 10,
    getFill: ({ output }) => {

      if (!output.variables?.RPA_Result) {
        return;
      }

      console.log(logHtml);

      return {
        content: <iframe width="100%" srcDoc={ logHtml } />,
        label: 'RPA Log'
      };
    }
  }
];