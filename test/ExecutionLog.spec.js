import ExecutionLog, {
  EXECUTION_LOG_ENTRY_STATUS,
  EXECUTION_LOG_ENTRY_TYPE,
  formatElementType
} from '../lib/ExecutionLog';

import { TASK_EXECUTION_FINISHED_REASON } from '../lib/TaskExecution';

import {
  createDeployResponse,
  createStartInstanceResponse,
  createGetProcessInstanceElementInstancesResponse,
  createGetProcessInstanceJobsResponse,
  createGetProcessInstanceMessageSubscriptionsResponse,
  createGetProcessInstanceResponse,
  createGetProcessInstanceUserTasksResponse,
  createGetProcessInstanceVariablesResponse,
  createElementInstanceDetails,
  createIncidentDetails,
  createJobDetails,
  createMessageSubscriptionDetails,
  createMockDate,
  createMockTimestamp,
  createProcessInstanceDetails,
  createUserTaskDetails,
  ONE_SECOND_MS,
  DEFAULT_PROCESS_INSTANCE_KEY,
  DEFAULT_PROCESS_DEFINITION_KEY
} from './helpers/responses';

describe('ExecutionLog', function() {

  describe('formatElementType', function() {

    it('should format SERVICE_TASK to title case', function() {
      expect(formatElementType('SERVICE_TASK')).to.equal('Service Task');
    });

    it('should format BOUNDARY_EVENT', function() {
      expect(formatElementType('BOUNDARY_EVENT')).to.equal('Boundary Event');
    });

  });


  describe('class', function() {

    let executionLog;

    beforeEach(function() {
      executionLog = new ExecutionLog();
    });


    describe('ephemeral state', function() {

      it('should return deploying entry when state is deploying and no deploy response', function() {

        // given
        const deployingTimestamp = createMockTimestamp();

        // when
        executionLog.setState(EXECUTION_LOG_ENTRY_STATUS.DEPLOYING, deployingTimestamp);

        // then
        const entries = executionLog.getEntries();
        const statuses = entries.map(e => e.status);

        expect(statuses).to.deep.equal([
          EXECUTION_LOG_ENTRY_STATUS.DEPLOYING
        ]);

        expect(entries[0]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.DEPLOYING,
          timestamp: deployingTimestamp
        });
      });


      it('should return starting-instance entry when state is starting-instance and no start response', function() {

        // given
        const deployTimestamp = createMockTimestamp();
        const startingTimestamp = createMockTimestamp(ONE_SECOND_MS);

        executionLog.setDeployResponse(createDeployResponse(), deployTimestamp);

        // when
        executionLog.setState(EXECUTION_LOG_ENTRY_STATUS.STARTING_INSTANCE, startingTimestamp);

        // then
        const entries = executionLog.getEntries();
        const statuses = entries.map(e => e.status);

        expect(statuses).to.deep.equal([
          EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
          EXECUTION_LOG_ENTRY_STATUS.STARTING_INSTANCE
        ]);

        expect(entries[1]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.STARTING_INSTANCE,
          timestamp: startingTimestamp
        });
      });


      it('should return executing entry when state is executing and no poll/finished result', function() {

        // given
        const deployTimestamp = createMockTimestamp();
        const startTimestamp = createMockTimestamp(ONE_SECOND_MS);
        const executingTimestamp = createMockTimestamp(ONE_SECOND_MS * 2);

        executionLog.setDeployResponse(createDeployResponse(), deployTimestamp);
        executionLog.setStartInstanceResponse(createStartInstanceResponse(), startTimestamp);

        // when
        executionLog.setState(EXECUTION_LOG_ENTRY_STATUS.EXECUTING, executingTimestamp);

        // then
        const entries = executionLog.getEntries();
        const statuses = entries.map(e => e.status);

        expect(statuses).to.deep.equal([
          EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
          EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED,
          EXECUTION_LOG_ENTRY_STATUS.EXECUTING
        ]);

        expect(entries[2]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.EXECUTING,
          timestamp: executingTimestamp
        });
      });


      it('should NOT include deploying state when deploy response exists', function() {

        // given
        const deployingTimestamp = createMockTimestamp();
        const deployTimestamp = createMockTimestamp(ONE_SECOND_MS);

        executionLog.setState(EXECUTION_LOG_ENTRY_STATUS.DEPLOYING, deployingTimestamp);

        // when
        executionLog.setDeployResponse(createDeployResponse(), deployTimestamp);

        // then
        const entries = executionLog.getEntries();
        const statuses = entries.map(e => e.status);

        expect(statuses).to.deep.equal([
          EXECUTION_LOG_ENTRY_STATUS.DEPLOYED
        ]);

        expect(entries[0]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
          timestamp: deployTimestamp
        });
      });


      it('should NOT include starting-instance state when start response exists', function() {

        // given
        const deployTimestamp = createMockTimestamp();
        const startingTimestamp = createMockTimestamp(ONE_SECOND_MS);
        const startTimestamp = createMockTimestamp(ONE_SECOND_MS * 2);

        executionLog.setDeployResponse(createDeployResponse(), deployTimestamp);
        executionLog.setState(EXECUTION_LOG_ENTRY_STATUS.STARTING_INSTANCE, startingTimestamp);

        // when
        executionLog.setStartInstanceResponse(createStartInstanceResponse(), startTimestamp);

        // then
        const entries = executionLog.getEntries();
        const statuses = entries.map(e => e.status);

        expect(statuses).to.deep.equal([
          EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
          EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED
        ]);

        expect(entries[1]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED,
          timestamp: startTimestamp
        });
      });


      it('should NOT include executing state when polled result exists', function() {

        // given
        const deployTimestamp = createMockTimestamp();
        const startTimestamp = createMockTimestamp(ONE_SECOND_MS);
        const executingTimestamp = createMockTimestamp(ONE_SECOND_MS * 2);
        const pollTimestamp = createMockTimestamp(ONE_SECOND_MS * 3);

        executionLog.setDeployResponse(createDeployResponse(), deployTimestamp);
        executionLog.setStartInstanceResponse(createStartInstanceResponse(), startTimestamp);
        executionLog.setState(EXECUTION_LOG_ENTRY_STATUS.EXECUTING, executingTimestamp);

        // when
        executionLog.setPolledResult(createPolledResult(), pollTimestamp);

        // then
        const entries = executionLog.getEntries();
        const statuses = entries.map(e => e.status);

        expect(statuses).to.deep.equal([
          EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
          EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED
        ]);

        const executingEntries = entries.filter(e => e.status === EXECUTION_LOG_ENTRY_STATUS.EXECUTING);

        expect(executingEntries).to.have.length(0);
      });


      it('should NOT include executing state when finished result exists', function() {

        // given
        const deployTimestamp = createMockTimestamp();
        const startTimestamp = createMockTimestamp(ONE_SECOND_MS);
        const executingTimestamp = createMockTimestamp(ONE_SECOND_MS * 2);
        const finishedTimestamp = createMockTimestamp(ONE_SECOND_MS * 3);

        executionLog.setDeployResponse(createDeployResponse(), deployTimestamp);
        executionLog.setStartInstanceResponse(createStartInstanceResponse(), startTimestamp);
        executionLog.setState(EXECUTION_LOG_ENTRY_STATUS.EXECUTING, executingTimestamp);

        // when
        executionLog.setFinishedResult({ success: true, processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY }, finishedTimestamp);

        // then
        const entries = executionLog.getEntries();
        const statuses = entries.map(e => e.status);

        expect(statuses).to.deep.equal([
          EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
          EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED,
          EXECUTION_LOG_ENTRY_STATUS.COMPLETED
        ]);

        const executingEntries = entries.filter(e => e.status === EXECUTION_LOG_ENTRY_STATUS.EXECUTING);

        expect(executingEntries).to.have.length(0);
      });

    });


    describe('deploy response', function() {

      it('should create deployed status entry', function() {

        // given
        const deployingTimestamp = createMockTimestamp();

        const deployResponse = createDeployResponse();

        // when
        executionLog.setDeployResponse(deployResponse, deployingTimestamp);

        // then
        const entries = executionLog.getEntries();

        expect(entries).to.have.length(1);
        expect(entries[0]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
          timestamp: deployingTimestamp,
          data: {
            processDefinitionId: 'Process_1',
            processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY,
            processDefinitionVersion: 1,
            deploymentKey: '1'
          }
        });
      });
    });


    describe('start instance response', function() {

      it('should create instance-started status entry', function() {

        // given
        const startTimestamp = createMockTimestamp();

        const startResponse = createStartInstanceResponse();

        // when
        executionLog.setStartInstanceResponse(startResponse, startTimestamp);

        // then
        const entries = executionLog.getEntries();

        expect(entries).to.have.length(1);
        expect(entries[0]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED,
          timestamp: startTimestamp,
          data: {
            processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
            processDefinitionId: 'Process_1',
            processDefinitionKey: DEFAULT_PROCESS_DEFINITION_KEY
          }
        });
      });

    });


    describe('polled result - jobs', function() {

      it('should create single entry for created job', function() {

        // given
        const creationTime = createMockDate();

        const job = createJobDetails({
          state: 'CREATED',
          creationTime,
          endTime: undefined
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ job ], page: { totalItems: 1 } }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const jobEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.JOB);

        expect(jobEntries).to.have.length(1);
        expect(jobEntries[0].timestamp).to.equal(new Date(creationTime).getTime());
        expect(jobEntries[0].data.state).to.equal('CREATED');
      });


      it('should create two entries for completed job', function() {

        // given
        const creationTime = createMockDate();
        const endTime = createMockDate(ONE_SECOND_MS);

        const job = createJobDetails({
          state: 'COMPLETED',
          creationTime,
          endTime
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ job ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const jobEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.JOB);

        expect(jobEntries).to.have.length(2);

        // First entry for job created
        expect(jobEntries[0].timestamp).to.equal(new Date(creationTime).getTime());
        expect(jobEntries[0].data.state).to.equal('CREATED');

        // Second entry for job completed
        expect(jobEntries[1].timestamp).to.equal(new Date(endTime).getTime());
        expect(jobEntries[1].data.state).to.equal('COMPLETED');
      });


      it('should resolve creation timestamp from element instance when job has no creationTime (pre-8.9)', function() {

        // given
        const elementInstanceStartDate = createMockDate();
        const elementInstanceEndDate = createMockDate(ONE_SECOND_MS * 2);

        const elementInstance = createElementInstanceDetails({
          startDate: elementInstanceStartDate,
          endDate: elementInstanceEndDate
        });

        const jobEndTime = createMockDate(ONE_SECOND_MS);

        const job = createJobDetails({
          state: 'COMPLETED',
          creationTime: undefined,
          endTime: jobEndTime
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ job ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const jobEntries = entries.filter(e => e.type === 'job');

        expect(jobEntries).to.have.length(2);

        // First entry: creation time resolved from element instance startDate
        expect(jobEntries[0].timestamp).to.equal(new Date(elementInstanceStartDate).getTime());
        expect(jobEntries[0].data.state).to.equal('CREATED');

        // Second entry: end time resolved from job endTime
        expect(jobEntries[1].timestamp).to.equal(new Date(jobEndTime).getTime());
        expect(jobEntries[1].data.state).to.equal('COMPLETED');
      });

    });


    describe('polled result - user tasks', function() {

      it('should create single entry for created user task', function() {

        // given
        const creationDate = createMockDate();

        const task = createUserTaskDetails({
          state: 'CREATED',
          creationDate: creationDate,
          completionDate: undefined
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          userTasksResponse: createGetProcessInstanceUserTasksResponse({
            response: { items: [ task ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const taskEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK);

        expect(taskEntries).to.have.length(1);
        expect(taskEntries[0].timestamp).to.equal(new Date(creationDate).getTime());
        expect(taskEntries[0].data.state).to.equal('CREATED');
      });


      it('should create two entries for a user task with creationDate and completionDate', function() {

        // given
        const creationDate = createMockDate();
        const completionDate = createMockDate(ONE_SECOND_MS);

        const task = createUserTaskDetails({
          state: 'COMPLETED',
          creationDate,
          completionDate
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          userTasksResponse: createGetProcessInstanceUserTasksResponse({
            response: { items: [ task ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const taskEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK);

        expect(taskEntries).to.have.length(2);

        // First: created entry
        expect(taskEntries[0].data.state).to.equal('CREATED');
        expect(taskEntries[0].timestamp).to.equal(new Date(creationDate).getTime());

        // Second: completed entry
        expect(taskEntries[1].data.state).to.equal('COMPLETED');
        expect(taskEntries[1].timestamp).to.equal(new Date(completionDate).getTime());
      });

    });


    describe('polled result - element instances', function() {

      it('should create single entry for an element instance with only startDate', function() {

        // given
        const startDate = createMockDate();

        const instance = createElementInstanceDetails({
          state: 'ACTIVE',
          startDate: startDate,
          endDate: undefined
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ instance ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const instanceEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE);

        expect(instanceEntries).to.have.length(1);
        expect(instanceEntries[0].data.state).to.equal('ACTIVE');
      });


      it('should create two entries for an element instance with startDate and endDate', function() {

        // given
        const startDate = createMockDate();
        const endDate = createMockDate(ONE_SECOND_MS);

        const instance = createElementInstanceDetails({
          state: 'COMPLETED',
          startDate,
          endDate
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ instance ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const instanceEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE);

        expect(instanceEntries).to.have.length(2);

        // First: created entry
        expect(instanceEntries[0].data.state).to.equal('ACTIVE');
        expect(instanceEntries[0].timestamp).to.equal(new Date(startDate).getTime());

        // Second: completed entry
        expect(instanceEntries[1].data.state).to.equal('COMPLETED');
        expect(instanceEntries[1].timestamp).to.equal(new Date(endDate).getTime());
      });

    });


    describe('polled result - message subscriptions', function() {

      it('should create single entry for created message subscription', function() {

        // given
        const elementInstanceStartDate = createMockDate();

        const elementInstance = createElementInstanceDetails({
          state: 'ACTIVE',
          elementInstanceKey: '1',
          startDate: elementInstanceStartDate
        });

        const subscription = createMessageSubscriptionDetails({
          elementInstanceKey: '1',
          messageSubscriptionState: 'CREATED'
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          }),
          messageSubscriptionsResponse: createGetProcessInstanceMessageSubscriptionsResponse({
            response: { items: [ subscription ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const subEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION);

        expect(subEntries).to.have.length(1);
        expect(subEntries[0].timestamp).to.equal(new Date(elementInstanceStartDate).getTime());
      });


      it('should create two entries for correlated message subscription', function() {

        // given
        const elementInstanceStartDate = createMockDate();
        const elementInstanceEndDate = createMockDate(ONE_SECOND_MS);

        const elementInstance = createElementInstanceDetails({
          state: 'COMPLETED',
          elementInstanceKey: '1',
          startDate: elementInstanceStartDate,
          endDate: elementInstanceEndDate
        });

        const subscription = createMessageSubscriptionDetails({
          elementInstanceKey: '1',
          messageSubscriptionState: 'CORRELATED'
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          }),
          messageSubscriptionsResponse: createGetProcessInstanceMessageSubscriptionsResponse({
            response: { items: [ subscription ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const subEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION);

        expect(subEntries).to.have.length(2);
        expect(subEntries[0].timestamp).to.equal(new Date(elementInstanceStartDate).getTime());
        expect(subEntries[1].timestamp).to.equal(new Date(elementInstanceEndDate).getTime());
      });

    });


    describe('finished result', function() {

      it('should create completed status entry on success', function() {

        // given
        const timestamp = createMockTimestamp();

        // when
        executionLog.setFinishedResult({
          success: true,
          processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY
        }, timestamp);

        // then
        const entries = executionLog.getEntries();

        expect(entries).to.have.length(1);
        expect(entries[0]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.COMPLETED,
          timestamp: timestamp
        });
        expect(entries[0].data.processInstanceKey).to.equal(DEFAULT_PROCESS_INSTANCE_KEY);
      });


      it('should create incident status entry', function() {

        // given
        const timestamp = createMockTimestamp();

        const incident = createIncidentDetails({
          errorType: 'JOB_NO_RETRIES',
          errorMessage: 'foo'
        });

        // when
        executionLog.setFinishedResult({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.INCIDENT,
          processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
          incident
        }, timestamp);

        // then
        const entries = executionLog.getEntries();

        expect(entries).to.have.length(1);
        expect(entries[0].status).to.equal(EXECUTION_LOG_ENTRY_STATUS.INCIDENT);
        expect(entries[0].data.processInstanceKey).to.equal(DEFAULT_PROCESS_INSTANCE_KEY);
        expect(entries[0].data.errorType).to.equal('JOB_NO_RETRIES');
        expect(entries[0].data.errorMessage).to.equal('foo');
      });


      it('should create terminated status entry', function() {

        // given
        const timestamp = createMockTimestamp();

        // when
        executionLog.setFinishedResult({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.TERMINATED,
          processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY
        }, timestamp);

        // then
        const entries = executionLog.getEntries();

        expect(entries).to.have.length(1);
        expect(entries[0].status).to.equal(EXECUTION_LOG_ENTRY_STATUS.TERMINATED);
      });


      it('should create canceled status entry for user cancel', function() {

        // given
        const timestamp = createMockTimestamp();

        // when
        executionLog.setFinishedResult({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.CANCELED
        }, timestamp);

        // then
        const entries = executionLog.getEntries();

        expect(entries).to.have.length(1);
        expect(entries[0].status).to.equal(EXECUTION_LOG_ENTRY_STATUS.CANCELED);
      });


      it('should create canceled status entry for selection changed', function() {

        // given
        const timestamp = createMockTimestamp();

        // when
        executionLog.setFinishedResult({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.SELECTION_CHANGED
        }, timestamp);

        // then
        const entries = executionLog.getEntries();

        expect(entries).to.have.length(1);
        expect(entries[0].status).to.equal(EXECUTION_LOG_ENTRY_STATUS.CANCELED);
      });


      it('should create canceled status entry with error data for error', function() {

        // given
        const timestamp = createMockTimestamp();

        const error = { message: 'Something went wrong' };

        // when
        executionLog.setFinishedResult({
          success: false,
          reason: TASK_EXECUTION_FINISHED_REASON.ERROR,
          error
        }, timestamp);

        // then
        const entries = executionLog.getEntries();

        expect(entries).to.have.length(1);
        expect(entries[0].status).to.equal(EXECUTION_LOG_ENTRY_STATUS.CANCELED);
        expect(entries[0].data.error).to.equal(error);
      });

    });


    describe('chronological sorting', function() {

      it('should sort all entries by timestamp', function() {

        // given
        const job = createJobDetails({
          state: 'COMPLETED',
          creationTime: createMockDate(ONE_SECOND_MS * 3),
          endTime: createMockDate(ONE_SECOND_MS * 4)
        });

        const elementInstance = createElementInstanceDetails({
          state: 'COMPLETED',
          startDate: createMockDate(ONE_SECOND_MS * 2),
          endDate: createMockDate(ONE_SECOND_MS * 5)
        });

        // when
        executionLog.setDeployResponse(createDeployResponse(), createMockTimestamp());
        executionLog.setStartInstanceResponse(createStartInstanceResponse(), createMockTimestamp(ONE_SECOND_MS * 3));
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ job ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          }),
          processInstanceResponse: createGetProcessInstanceResponse({
            response: {
              items: [ createProcessInstanceDetails({ startDate: createMockDate(ONE_SECOND_MS) }) ],
              page: { totalItems: 1 }
            }
          })
        }), createMockTimestamp(ONE_SECOND_MS * 6));

        // then
        const entries = executionLog.getEntries();
        const timestamps = entries.map(e => e.timestamp);

        // Verify timestamps are in ascending order
        for (let i = 1; i < timestamps.length; i++) {
          expect(timestamps[i]).to.be.at.least(timestamps[i - 1]);
        }

        // Verify instance-started comes before element-instance entries
        const types = entries.map(e => e.status || `${e.type}:${e.data?.state}`);

        expect(types).to.deep.equal([
          'deployed',
          'instance-started',
          'element-instance:ACTIVE',
          'job:CREATED',
          'job:COMPLETED',
          'element-instance:COMPLETED'
        ]);
      });

    });


    describe('full lifecycle', function() {

      it('should produce correct entries for deploy → start → poll → finish', function() {

        // given
        const deployTimestamp = createMockTimestamp();
        const startTimestamp = createMockTimestamp(ONE_SECOND_MS);
        const pollTimestamp = createMockTimestamp(ONE_SECOND_MS * 6);
        const finishTimestamp = createMockTimestamp(ONE_SECOND_MS * 6);

        const job = createJobDetails({
          state: 'COMPLETED',
          creationTime: createMockDate(ONE_SECOND_MS * 3),
          endTime: createMockDate(ONE_SECOND_MS * 4)
        });

        const elementInstance = createElementInstanceDetails({
          state: 'COMPLETED',
          startDate: createMockDate(ONE_SECOND_MS * 2),
          endDate: createMockDate(ONE_SECOND_MS * 5)
        });

        // when
        executionLog.setDeployResponse(createDeployResponse(), deployTimestamp);
        executionLog.setStartInstanceResponse(createStartInstanceResponse(), startTimestamp);
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ job ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), pollTimestamp);
        executionLog.setFinishedResult({ success: true, processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY }, finishTimestamp);

        // then
        const entries = executionLog.getEntries();

        expect(entries).to.have.length(7);

        expect(entries[0]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
          timestamp: deployTimestamp
        });

        expect(entries[1]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED,
          timestamp: startTimestamp
        });

        expect(entries[2]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE,
          timestamp: new Date(elementInstance.startDate).getTime()
        });
        expect(entries[2].data).to.deep.include({
          state: 'ACTIVE'
        });

        expect(entries[3]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.JOB,
          timestamp: new Date(job.creationTime).getTime()
        });
        expect(entries[3].data).to.deep.include({
          state: 'CREATED'
        });

        expect(entries[4]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.JOB,
          timestamp: new Date(job.endTime).getTime()
        });
        expect(entries[4].data).to.deep.include({
          state: 'COMPLETED'
        });

        expect(entries[5]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE,
          timestamp: new Date(elementInstance.endDate).getTime()
        });
        expect(entries[5].data).to.deep.include({
          state: 'COMPLETED'
        });

        expect(entries[6]).to.deep.include({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.COMPLETED,
          timestamp: finishTimestamp
        });
      });

    });


    describe('failed API responses', function() {

      it('should skip items from failed jobs response', function() {

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            success: false,
            error: 'Failed to fetch jobs',
            errorType: 'HttpSdkError'
          }),
          userTasksResponse: createGetProcessInstanceUserTasksResponse({
            response: { items: [ createUserTaskDetails() ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const jobEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.JOB);
        const taskEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK);

        expect(jobEntries).to.have.length(0);
        expect(taskEntries.length).to.be.greaterThan(0);
      });


      it('should skip items from failed user tasks response', function() {

        // when
        executionLog.setPolledResult(createPolledResult({
          userTasksResponse: createGetProcessInstanceUserTasksResponse({
            success: false,
            error: 'Failed to fetch user tasks',
            errorType: 'HttpSdkError'
          }),
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ createJobDetails() ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const taskEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.USER_TASK);
        const jobEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.JOB);

        expect(taskEntries).to.have.length(0);
        expect(jobEntries.length).to.be.greaterThan(0);
      });


      it('should skip items from failed element instances response', function() {

        // when
        executionLog.setPolledResult(createPolledResult({
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            success: false,
            error: 'Failed to fetch element instances',
            errorType: 'HttpSdkError'
          }),
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ createJobDetails() ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const instanceEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE);
        const jobEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.JOB);

        expect(instanceEntries).to.have.length(0);
        expect(jobEntries.length).to.be.greaterThan(0);
      });


      it('should skip items from failed message subscriptions response', function() {

        // when
        executionLog.setPolledResult(createPolledResult({
          messageSubscriptionsResponse: createGetProcessInstanceMessageSubscriptionsResponse({
            success: false,
            error: 'Failed to fetch message subscriptions',
            errorType: 'HttpSdkError'
          }),
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ createJobDetails() ] }
          })
        }), createMockTimestamp());

        // then
        const entries = executionLog.getEntries();
        const subEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION);
        const jobEntries = entries.filter(e => e.type === EXECUTION_LOG_ENTRY_TYPE.JOB);

        expect(subEntries).to.have.length(0);
        expect(jobEntries.length).to.be.greaterThan(0);
      });

    });


    describe('reset', function() {

      it('should clear all entries', function() {

        // given
        executionLog.setDeployResponse(createDeployResponse(), createMockTimestamp());
        executionLog.setStartInstanceResponse(createStartInstanceResponse(), createMockTimestamp());

        expect(executionLog.getEntries()).to.have.length(2);

        // when
        executionLog.reset();

        // then
        expect(executionLog.getEntries()).to.have.length(0);
      });

    });

  });

});

/**
 * Create a polled result with default responses, allowing overrides.
 *
 * @param {Partial<TaskExecutionPolledResult>} overrides
 *
 * @returns {TaskExecutionPolledResult}
 */
function createPolledResult(overrides = {}) {
  return {
    elementId: 'ServiceTask_1',
    processInstanceKey: DEFAULT_PROCESS_INSTANCE_KEY,
    elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
      response: { items: [], page: { totalItems: 0 } }
    }),
    jobsResponse: createGetProcessInstanceJobsResponse({
      response: { items: [], page: { totalItems: 0 } }
    }),
    messageSubscriptionsResponse: createGetProcessInstanceMessageSubscriptionsResponse({
      response: { items: [], page: { totalItems: 0 } }
    }),
    processInstanceResponse: { success: true, response: {} },
    userTasksResponse: createGetProcessInstanceUserTasksResponse({
      response: { items: [], page: { totalItems: 0 } }
    }),
    variablesResponse: createGetProcessInstanceVariablesResponse({
      response: { items: [], page: { totalItems: 0 } }
    }),
    ...overrides
  };
}