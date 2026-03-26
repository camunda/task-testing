/**
 * @import {
 *   CamundaClient,
 *   Job
 * } from '@camunda8/orchestration-cluster-api'
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';

import createCamundaClient, { JobActionReceiptSymbol } from '@camunda8/orchestration-cluster-api';

import { createApi } from './api.mjs';

let api;

try {
  const { parsed: config } = dotenv.config({ path: path.join(__dirname, '.env') });

  if (!Object.keys(config)?.length) {
    throw new Error('No configuration found in .env file');
  }

  const camundaClient = createCamundaClient({ config });

  console.log('Created Camunda 8 client');

  const topology = await camundaClient.getTopology();

  console.log('Topology:', topology);

  api = createApi(camundaClient);

  createJobWorkers(camundaClient);
} catch (error) {
  console.error('Failed to create Camunda 8 client:', error);
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
  if (!api) {
    return res.json({ success: false, error: 'Camunda environment not configured' });
  }

  const { resources } = req.body;

  const result = await api.deployResources(resources);
  res.json(result);
});

app.post('/api/startInstance', async (req, res) => {
  if (!api) {
    return res.json({ success: false, error: 'Camunda environment not configured' });
  }

  const { processDefinitionKey, elementId, variables } = req.body;

  const result = await api.createProcessInstance({ processDefinitionKey, elementId, variables });
  res.json(result);
});

app.get('/api/getProcessInstance/:processInstanceKey', async (req, res) => {
  if (!api) {
    return res.json({ success: false, error: 'Camunda environment not configured' });
  }

  const { processInstanceKey } = req.params;
  const result = await api.searchProcessInstances(processInstanceKey);
  res.json(result);
});

app.get('/api/getProcessInstanceVariables/:processInstanceKey', async (req, res) => {
  if (!api) {
    return res.json({ success: false, error: 'Camunda environment not configured' });
  }

  const { processInstanceKey } = req.params;
  const result = await api.searchVariables(processInstanceKey);
  res.json(result);
});

app.get('/api/getProcessInstanceElementInstances/:processInstanceKey', async (req, res) => {
  if (!api) {
    return res.json({ success: false, error: 'Camunda environment not configured' });
  }

  const { processInstanceKey } = req.params;
  const result = await api.searchElementInstances(processInstanceKey);
  res.json(result);
});

app.get('/api/getProcessInstanceIncident/:processInstanceKey', async (req, res) => {
  if (!api) {
    return res.json({ success: false, error: 'Camunda environment not configured' });
  }

  const { processInstanceKey } = req.params;
  const result = await api.searchIncidents(processInstanceKey);
  res.json(result);
});

app.get('/api/getProcessInstanceJobs/:processInstanceKey', async (req, res) => {
  if (!api) {
    return res.json({ success: false, error: 'Camunda environment not configured' });
  }

  const { processInstanceKey } = req.params;
  const result = await api.searchJobs(processInstanceKey);
  res.json(result);
});

app.get('/api/getProcessInstanceUserTasks/:processInstanceKey', async (req, res) => {
  if (!api) {
    return res.json({ success: false, error: 'Camunda environment not configured' });
  }

  const { processInstanceKey } = req.params;
  const result = await api.searchUserTasks(processInstanceKey);
  res.json(result);
});

app.get('/api/getProcessInstanceMessageSubscriptions/:processInstanceKey', async (req, res) => {
  if (!api) {
    return res.json({ success: false, error: 'Camunda environment not configured' });
  }

  const { processInstanceKey } = req.params;
  const result = await api.searchMessageSubscriptions(processInstanceKey);
  res.json(result);
});

/**
 * Create job workers for demo.
 *
 * @param {CamundaClient} camundaClient
 */
function createJobWorkers(camundaClient) {
  if (!camundaClient) {
    console.warn('Camunda environment not configured, job worker not started');
    return;
  }

  /**
   * Start 'foo' worker. Completes after delay, optionally failing based on
   * input variable. Sets variable to indicate it was there.
   */
  camundaClient.createJobWorker({
    jobType: 'foo',
    jobHandler: async (job) => {
      console.log(`🛠️ [${getJobLabel(job)}] Handling job ${job.jobKey}...`);

      console.log(`🛠️ [${getJobLabel(job)}] Job variables:`, job.variables);
      console.log(`🛠️ [${getJobLabel(job)}] Job custom headers:`, job.customHeaders);

      const { delay = 5, failJob = false } = job.variables;

      console.log(
        `🛠️ [${getJobLabel(job)}] Job will take ${delay} seconds to complete...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay * 1000));

      try {
        if (failJob) {
          await job.fail({
            errorMessage: 'Simulated failure'
          });

          console.log(`🛠️ [${getJobLabel(job)}] Job failed with message: Simulated failure`);

          return JobActionReceiptSymbol;
        }
        await job.complete({ fooExecutionListener: true });

        console.log(`🛠️ [${getJobLabel(job)}] Job completed...`);

        return JobActionReceiptSymbol;
      } catch (e) {
        console.warn(`🛠️ [${getJobLabel(job)}] Could not complete job ${job.jobKey}: ${e.detail || e.message}`);

        return JobActionReceiptSymbol;
      }
    },
    pollIntervalMs: 1000,
    jobTimeoutMs: 50000,
    maxParallelJobs: 5
  });

  [
    'bar',
    'baz'
  ].forEach(type => {

    /**
     * Start execution listener worker for given type. Completes after delay,
     * setting variable to indicate it was there.
     */
    camundaClient.createJobWorker({
      jobType: type,
      jobHandler: async (job) => {
        console.log(`🛠️ [${getJobLabel(job)}] Handling job ${job.jobKey}...`);

        console.log(`🛠️ [${getJobLabel(job)}] Job variables:`, job.variables);
        console.log(`🛠️ [${getJobLabel(job)}] Job custom headers:`, job.customHeaders);

        console.log(`🛠️ [${getJobLabel(job)}] Job will take 3 seconds to complete...`);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
          await job.complete({ [ `${type}ExecutionListener` ]: true });

          console.log(`🛠️ [${getJobLabel(job)}] Job completed...`);

          return JobActionReceiptSymbol;
        } catch (e) {
          console.warn(`🛠️ [${getJobLabel(job)}] Could not complete job ${job.jobKey}: ${e.detail || e.message}`);

          return JobActionReceiptSymbol;
        }
      },
      pollIntervalMs: 1000,
      jobTimeoutMs: 50000,
      maxParallelJobs: 5
    });
  });

  /**
   * Start execution listener 'fooStart' worker. Completes after delay, setting
   * variable to indicate it was there.
   */
  camundaClient.createJobWorker({
    jobType: 'fooStart',
    jobHandler: async (job) => {
      console.log(`🛠️ [${getJobLabel(job)}] Handling job ${job.jobKey}...`);

      console.log(`🛠️ [${getJobLabel(job)}] Job variables:`, job.variables);
      console.log(`🛠️ [${getJobLabel(job)}] Job custom headers:`, job.customHeaders);

      console.log(`🛠️ [${getJobLabel(job)}] Job will take 3 seconds to complete...`);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      try {
        await job.complete({ fooStartExecutionListener: true });

        console.log(`🛠️ [${getJobLabel(job)}] Job completed...`);

        return JobActionReceiptSymbol;
      } catch (e) {
        console.warn(`🛠️ [${getJobLabel(job)}] Could not complete job ${job.jobKey}: ${e.detail || e.message}`);

        return JobActionReceiptSymbol;
      }
    },
    pollIntervalMs: 1000,
    jobTimeoutMs: 50000,
    maxParallelJobs: 5
  });

  /**
   * Start execution listener 'fooEnd' worker. Completes after delay, setting
   * variable to indicate it was there.
   */
  camundaClient.createJobWorker({
    jobType: 'fooEnd',
    jobHandler: async (job) => {
      console.log(`🛠️ [${getJobLabel(job)}] Handling job ${job.jobKey}...`);

      console.log(`🛠️ [${getJobLabel(job)}] Job variables:`, job.variables);
      console.log(`🛠️ [${getJobLabel(job)}] Job custom headers:`, job.customHeaders);

      console.log(`🛠️ [${getJobLabel(job)}] Job will take 3 seconds to complete...`);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      try {
        await job.complete({ fooEndExecutionListener: true });

        console.log(`🛠️ [${getJobLabel(job)}] Job completed...`);

        return JobActionReceiptSymbol;
      } catch (e) {
        console.warn(`🛠️ [${getJobLabel(job)}] Could not complete job ${job.jobKey}: ${e.detail || e.message}`);

        return JobActionReceiptSymbol;
      }
    },
    pollIntervalMs: 1000,
    jobTimeoutMs: 50000,
    maxParallelJobs: 5
  });

  /**
   * Start execution listener 'publish-message' worker. Publishes a message
   * after delay and completes, setting variable to indicate it was there.
   */
  camundaClient.createJobWorker({
    jobType: 'publish-message',
    jobHandler: async (job) => {
      console.log(`🛠️ [${getJobLabel(job)}] Handling job ${job.jobKey}...`);

      console.log(`🛠️ [${getJobLabel(job)}] Job variables:`, job.variables);
      console.log(`🛠️ [${getJobLabel(job)}] Job custom headers:`, job.customHeaders);

      console.log(`🛠️ [${getJobLabel(job)}] Job will publish message after ${job.variables.messageDelay || 15} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, job.variables.messageDelay ? job.variables.messageDelay * 1000 : 15000));

      console.log(`🛠️ [${getJobLabel(job)}] Publishing message 'Message_1' with correlation key ${ job.variables.correlationKey }...`);

      await camundaClient.publishMessage({
        name: 'Message_1',
        correlationKey: job.variables.correlationKey,
        timeToLive: 10000
      });

      try {
        await job.complete({ publishMessageStartExecutionListener: true });

        console.log(`🛠️ [${getJobLabel(job)}] Job completed...`);

        return JobActionReceiptSymbol;
      } catch (e) {
        console.warn(`🛠️ [${getJobLabel(job)}] Could not complete job ${job.jobKey}: ${e.detail || e.message}`);

        return JobActionReceiptSymbol;
      }
    },
    pollIntervalMs: 1000,
    jobTimeoutMs: 50000,
    maxParallelJobs: 5
  });
}

/**
 * Get a human-friendly label for a job, including its type and last 4 digits of
 * the job key.
 *
 * @param {Job} job
 */
function getJobLabel(job) {
  const jobKey = job.jobKey.toString();

  return `${ job.jobType }:${ jobKey.slice(-4) }`;
}