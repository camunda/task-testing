import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';

import { Camunda8 } from '@camunda8/sdk';


/** @type {import('@camunda8/sdk').CamundaRestClient} */
let camundaRestClient;

try {

  const config = dotenv.config({ path: path.join(__dirname, '.env') }).parsed;

  if (!Object.keys(config)?.length) {
    throw new Error('No configuration found in .env file');
  }

  const c8 = new Camunda8(config);
  camundaRestClient = c8.getCamundaRestClient();

  createJobWorker();
} catch (error) {
  console.error('Failed to create Camunda 8 REST client:', error);
  console.warn('API requests will return { success: false }');
}

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Camunda 8 API starting on port ${PORT}\n`);
});

app.post('/api/deploy', async (req, res) => {
  try {
    if (!camundaRestClient) {
      return res.json({ success: false, error: 'Camunda environment not configured' });
    }

    const { xml } = req.body;

    const resources = [
      {
        name: 'diagram.bpmn',
        content: Buffer.from(xml, 'utf8')
      }
    ];

    const response = await camundaRestClient.deployResources(resources);

    res.json({ success: true, response });
  } catch (err) {
    console.error('Deployment error:', err);

    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/startInstance', async (req, res) => {
  try {
    if (!camundaRestClient) {
      return res.json({ success: false, error: 'Camunda environment not configured' });
    }

    const { processDefinitionKey, elementId, variables } = req.body;

    const response = await camundaRestClient.createProcessInstance({
      processDefinitionKey,
      variables,
      startInstructions:[
        {
          elementId
        }
      ],
      runtimeInstructions: [
        {
          type: 'TERMINATE_PROCESS_INSTANCE',
          afterElementId: elementId
        }
      ]
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/getProcessInstance/:processInstanceKey', async (req, res) => {
  try {
    if (!camundaRestClient) {
      return res.json({ success: false, error: 'Camunda environment not configured' });
    }

    const { processInstanceKey } = req.params;

    const response = await camundaRestClient.searchProcessInstances({
      filter: {
        processInstanceKey
      }
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/getProcessInstanceVariables/:processInstanceKey', async (req, res) => {
  try {
    if (!camundaRestClient) {
      return res.json({ success: false, error: 'Camunda environment not configured' });
    }

    const { processInstanceKey } = req.params;

    const response = await camundaRestClient.searchVariables({
      filter: {
        processInstanceKey
      }
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/getProcessInstanceElementInstances/:processInstanceKey', async (req, res) => {
  try {
    if (!camundaRestClient) {
      return res.json({ success: false, error: 'Camunda environment not configured' });
    }

    const { processInstanceKey } = req.params;

    const response = await camundaRestClient.searchElementInstances({
      filter: {
        processInstanceKey,
        type: 'SEQUENCE_FLOW'
      }
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/getProcessInstanceIncident/:processInstanceKey', async (req, res) => {
  try {
    if (!camundaRestClient) {
      return res.json({ success: false, error: 'Camunda environment not configured' });
    }

    const { processInstanceKey } = req.params;

    const response = await camundaRestClient.searchIncidents({
      filter: {
        processInstanceKey
      }
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function createJobWorker() {
  if (!camundaRestClient) {
    console.warn('Camunda environment not configured, job worker not started');
    return;
  }

  camundaRestClient.createJobWorker({
    type: 'foo',
    jobHandler: async (job) => {
      console.log('🚀 Processing job worker...');

      // Simulate some work with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('🚀 Job completed');

      job.complete({
        foo: 'jobWorkerWasHere'
      });
    },
    pollInterval: 1000,
    timeout: 5000,
    maxJobsToActivate: 5
  });
}