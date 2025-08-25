import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';

import { Camunda8 } from '@camunda8/sdk';

function removeProtocol(url) {
  return url.replace(/^(https?:\/\/|grpcs?:\/\/)/, '');
}

function createCamunda8Client() {
  const config = {
    ...process.env,
    ZEEBE_GRPC_ADDRESS: removeProtocol(process.env.ZEEBE_GRPC_ADDRESS),
    CAMUNDA_AUTH_STRATEGY: 'OAUTH',
    CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true
  };

  console.log('Camunda 8 Client Configuration:', config);

  return new Camunda8(config);
}

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const camunda = createCamunda8Client();

app.post('/api/deploy', async (req, res) => {
  try {
    const { xml } = req.body;

    const client = camunda.getCamundaRestClient();

    const resources = [
      {
        name: 'diagram.bpmn',
        content: Buffer.from(xml, 'utf8')
      }
    ];

    const response = await client.deployResources(resources);

    res.json({ success: true, response });
  } catch (err) {
    console.error('Deployment error:', err);

    res.status(500).json({ error: err.message });
  }
});

app.post('/api/startInstance', async (req, res) => {
  try {
    const { processId, elementId, variables } = req.body;

    const client = camunda.getCamundaRestClient();

    console.log('Starting process instance with:', {
      processDefinitionId: processId,
      variables,
      startInstructions:[
        {
          elementId
        }
      ],
      runtimeInstructions: [
        {
          afterElementId: elementId
        }
      ]
    });

    const response = await client.createProcessInstance({
      processDefinitionId: processId,
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
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/getProcessInstance/:processInstanceKey', async (req, res) => {
  try {
    const { processInstanceKey } = req.params;

    const client = camunda.getCamundaRestClient();

    const response = await client.searchProcessInstances({
      filter: {
        processInstanceKey
      }
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/getProcessInstanceVariables/:processInstanceKey', async (req, res) => {
  try {
    const { processInstanceKey } = req.params;

    const client = camunda.getCamundaRestClient();

    const response = await client.searchVariables({
      filter: {
        processInstanceKey
      }
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/getProcessInstanceIncident/:processInstanceKey', async (req, res) => {
  try {
    const { processInstanceKey } = req.params;

    const client = camunda.getOperateApiClient();

    const response = await client.searchIncidents({
      filter: {
        processInstanceKey
      }
    });

    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Camunda 8 API listening on port ${PORT}`);
});
