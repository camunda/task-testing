import ExecutionLog, {
  EXECUTION_LOG_ENTRY_STATUS,
  EXECUTION_LOG_ENTRY_TYPE,
  areRelated,
  formatElementType,
  getEntryOrder
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


      it('should place deployed before instance-started at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();

        // when
        executionLog.setDeployResponse(createDeployResponse(), timestamp);
        executionLog.setStartInstanceResponse(createStartInstanceResponse(), timestamp);

        // then
        const entries = executionLog.getEntries();
        const types = entries.map(e => e.status || e.type);

        expect(types).to.deep.equal([
          'deployed',
          'instance-started'
        ]);
      });


      it('should place instance-started before job and element-instance entries at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();

        const job = createJobDetails({
          state: 'CREATED',
          creationTime: createMockDate()
        });

        const elementInstance = createElementInstanceDetails({
          state: 'ACTIVE',
          startDate: createMockDate()
        });

        // when
        executionLog.setStartInstanceResponse(createStartInstanceResponse(), timestamp);
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ job ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const types = entries.map(e => e.status || `${e.type}:${e.data?.state}`);

        expect(types[0]).to.equal('instance-started');
        expect(types).to.include('job:CREATED');
        expect(types).to.include('element-instance:ACTIVE');
        expect(types.indexOf('instance-started')).to.be.lessThan(types.indexOf('job:CREATED'));
        expect(types.indexOf('instance-started')).to.be.lessThan(types.indexOf('element-instance:ACTIVE'));
      });


      it('should place element-instance ACTIVE before job CREATED at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();
        const startDate = createMockDate();

        const job = createJobDetails({
          state: 'CREATED',
          creationTime: startDate
        });

        const elementInstance = createElementInstanceDetails({
          state: 'ACTIVE',
          startDate
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ job ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const types = entries.map(e => `${e.type}:${e.data?.state}`);

        expect(types.indexOf('element-instance:ACTIVE')).to.be.lessThan(types.indexOf('job:CREATED'));
      });


      it('should place element-instance ACTIVE before user-task CREATED at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();
        const startDate = createMockDate();

        const userTask = createUserTaskDetails({
          elementId: 'UserTask_1',
          state: 'CREATED',
          creationDate: startDate
        });

        const elementInstance = createElementInstanceDetails({
          elementId: 'UserTask_1',
          state: 'ACTIVE',
          startDate
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          userTasksResponse: createGetProcessInstanceUserTasksResponse({
            response: { items: [ userTask ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const types = entries.map(e => `${e.type}:${e.data?.state}`);

        expect(types.indexOf('element-instance:ACTIVE')).to.be.lessThan(types.indexOf('user-task:CREATED'));
      });


      it('should place element-instance ACTIVE before message-subscription CREATED at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();
        const startDate = createMockDate();

        const subscription = createMessageSubscriptionDetails({
          messageSubscriptionState: 'CREATED'
        });

        const elementInstance = createElementInstanceDetails({
          state: 'ACTIVE',
          startDate
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          messageSubscriptionsResponse: createGetProcessInstanceMessageSubscriptionsResponse({
            response: { items: [ subscription ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const types = entries.map(e =>
          e.type === 'message-subscription'
            ? `${e.type}:${e.data?.messageSubscriptionState}`
            : `${e.type}:${e.data?.state}`
        );

        expect(types.indexOf('element-instance:ACTIVE')).to.be.lessThan(
          types.indexOf('message-subscription:CREATED')
        );
      });


      it('should place job CREATED before job COMPLETED at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();
        const time = createMockDate();

        const job = createJobDetails({
          state: 'COMPLETED',
          creationTime: time,
          endTime: time
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ job ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const jobEntries = entries.filter(e => e.type === 'job');

        expect(jobEntries).to.have.length(2);
        expect(jobEntries[0].data.state).to.equal('CREATED');
        expect(jobEntries[1].data.state).to.equal('COMPLETED');
      });


      it('should place message-subscription CREATED before CORRELATED at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();

        const subscription = createMessageSubscriptionDetails({
          messageSubscriptionState: 'CORRELATED'
        });

        const elementInstance = createElementInstanceDetails({
          state: 'COMPLETED',
          startDate: createMockDate(),
          endDate: createMockDate()
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          messageSubscriptionsResponse: createGetProcessInstanceMessageSubscriptionsResponse({
            response: { items: [ subscription ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const msgEntries = entries.filter(e => e.type === 'message-subscription');

        expect(msgEntries).to.have.length(2);
        expect(msgEntries[0].data.messageSubscriptionState).to.equal('CREATED');
        expect(msgEntries[1].data.messageSubscriptionState).to.equal('CORRELATED');
      });


      it('should place message-subscription CORRELATED before element-instance COMPLETED at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();
        const endDate = createMockDate(ONE_SECOND_MS);

        const subscription = createMessageSubscriptionDetails({
          messageSubscriptionState: 'CORRELATED'
        });

        const elementInstance = createElementInstanceDetails({
          state: 'COMPLETED',
          startDate: createMockDate(),
          endDate
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          messageSubscriptionsResponse: createGetProcessInstanceMessageSubscriptionsResponse({
            response: { items: [ subscription ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const types = entries.map(e =>
          e.type === 'message-subscription'
            ? `${e.type}:${e.data?.messageSubscriptionState}`
            : `${e.type}:${e.data?.state}`
        );

        expect(types.indexOf('message-subscription:CORRELATED')).to.be.lessThan(
          types.indexOf('element-instance:COMPLETED')
        );
      });


      it('should place user-task COMPLETED before element-instance COMPLETED at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();
        const endDate = createMockDate(ONE_SECOND_MS);

        const userTask = createUserTaskDetails({
          elementId: 'UserTask_1',
          state: 'COMPLETED',
          creationDate: createMockDate(),
          completionDate: endDate
        });

        const elementInstance = createElementInstanceDetails({
          elementId: 'UserTask_1',
          state: 'COMPLETED',
          startDate: createMockDate(),
          endDate
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          userTasksResponse: createGetProcessInstanceUserTasksResponse({
            response: { items: [ userTask ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const types = entries.map(e => `${e.type}:${e.data?.state}`);

        expect(types.indexOf('user-task:COMPLETED')).to.be.lessThan(
          types.indexOf('element-instance:COMPLETED')
        );
      });


      it('should place job completed before element-instance completed at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();
        const endTime = createMockDate(ONE_SECOND_MS);

        const job = createJobDetails({
          state: 'COMPLETED',
          creationTime: createMockDate(),
          endTime
        });

        const elementInstance = createElementInstanceDetails({
          state: 'COMPLETED',
          startDate: createMockDate(),
          endDate: endTime
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ job ] }
          }),
          elementInstancesResponse: createGetProcessInstanceElementInstancesResponse({
            response: { items: [ elementInstance ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const types = entries.map(e => e.status || `${e.type}:${e.data?.state}`);

        const jobCompletedIdx = types.indexOf('job:COMPLETED');
        const eiCompletedIdx = types.indexOf('element-instance:COMPLETED');

        expect(jobCompletedIdx).to.be.greaterThan(-1);
        expect(eiCompletedIdx).to.be.greaterThan(-1);
        expect(jobCompletedIdx).to.be.lessThan(eiCompletedIdx);
      });


      it('should NOT reorder unrelated entries at the same timestamp', function() {

        // given - two jobs from different elements sharing the same end timestamp
        const timestamp = createMockTimestamp();
        const endTime = createMockDate(ONE_SECOND_MS);

        const jobA = createJobDetails({
          jobKey: 'job-a',
          elementId: 'ServiceTask_A',
          state: 'COMPLETED',
          creationTime: createMockDate(),
          endTime
        });

        const jobB = createJobDetails({
          jobKey: 'job-b',
          elementId: 'ServiceTask_B',
          state: 'CREATED',
          creationTime: endTime
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ jobA, jobB ] }
          })
        }), timestamp);

        // then — job A COMPLETED (at endTime) and job B CREATED (at endTime)
        //  share the same timestamp but are unrelated, so insertion order is
        //  preserved (job A COMPLETED before job B CREATED).
        const entries = executionLog.getEntries();
        const atEndTime = entries
          .filter(e => e.timestamp === new Date(endTime).getTime())
          .map(e => `${e.data?.elementId}:${e.data?.state}`);

        expect(atEndTime.indexOf('ServiceTask_A:COMPLETED')).to.be.lessThan(
          atEndTime.indexOf('ServiceTask_B:CREATED')
        );
      });


      it('should place start execution listener COMPLETED before regular job CREATED at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();
        const time = createMockDate();

        const listenerJob = createJobDetails({
          jobKey: 'listener-1',
          elementId: 'ServiceTask_1',
          state: 'COMPLETED',
          kind: 'EXECUTION_LISTENER',
          listenerEventType: 'START',
          creationTime: time,
          endTime: time
        });

        const regularJob = createJobDetails({
          jobKey: 'regular-1',
          elementId: 'ServiceTask_1',
          state: 'CREATED',
          kind: 'BPMN_ELEMENT',
          listenerEventType: 'UNSPECIFIED',
          creationTime: time
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ regularJob, listenerJob ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const jobEntries = entries
          .filter(e => e.type === 'job' && e.timestamp === new Date(time).getTime())
          .map(e => `${e.data?.kind}:${e.data?.listenerEventType}:${e.data?.state}`);

        const listenerCompleted = jobEntries.indexOf('EXECUTION_LISTENER:START:COMPLETED');
        const regularCreated = jobEntries.indexOf('BPMN_ELEMENT:UNSPECIFIED:CREATED');

        expect(listenerCompleted).to.be.greaterThan(-1);
        expect(regularCreated).to.be.greaterThan(-1);
        expect(listenerCompleted).to.be.lessThan(regularCreated);
      });


      it('should place regular job COMPLETED before end execution listener CREATED at same timestamp', function() {

        // given
        const timestamp = createMockTimestamp();
        const time = createMockDate();

        const regularJob = createJobDetails({
          jobKey: 'regular-1',
          elementId: 'ServiceTask_1',
          state: 'COMPLETED',
          kind: 'BPMN_ELEMENT',
          listenerEventType: 'UNSPECIFIED',
          creationTime: time,
          endTime: time
        });

        const listenerJob = createJobDetails({
          jobKey: 'listener-1',
          elementId: 'ServiceTask_1',
          state: 'COMPLETED',
          kind: 'EXECUTION_LISTENER',
          listenerEventType: 'END',
          creationTime: time,
          endTime: time
        });

        // when
        executionLog.setPolledResult(createPolledResult({
          jobsResponse: createGetProcessInstanceJobsResponse({
            response: { items: [ listenerJob, regularJob ] }
          })
        }), timestamp);

        // then
        const entries = executionLog.getEntries();
        const jobEntries = entries
          .filter(e => e.type === 'job' && e.timestamp === new Date(time).getTime())
          .map(e => `${e.data?.kind}:${e.data?.listenerEventType}:${e.data?.state}`);

        const regularCompleted = jobEntries.indexOf('BPMN_ELEMENT:UNSPECIFIED:COMPLETED');
        const endListenerCreated = jobEntries.indexOf('EXECUTION_LISTENER:END:CREATED');

        expect(regularCompleted).to.be.greaterThan(-1);
        expect(endListenerCreated).to.be.greaterThan(-1);
        expect(regularCompleted).to.be.lessThan(endListenerCreated);
      });

    });


    describe('getEntryOrder', function() {

      it('should return 0 for deployed status', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.DEPLOYED,
          timestamp: 0
        })).to.equal(0);
      });


      it('should return 1 for instance-started status', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.INSTANCE_STARTED,
          timestamp: 0
        })).to.equal(1);
      });


      it('should return 2 for active element instances', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE,
          data: { state: 'ACTIVE' },
          timestamp: 0
        })).to.equal(2);
      });


      it('should return 3 for start execution listener job CREATED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.JOB,
          data: { state: 'CREATED', kind: 'EXECUTION_LISTENER', listenerEventType: 'START' },
          timestamp: 0
        })).to.equal(3);
      });


      it('should return 4 for start execution listener job COMPLETED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.JOB,
          data: { state: 'COMPLETED', kind: 'EXECUTION_LISTENER', listenerEventType: 'START' },
          timestamp: 0
        })).to.equal(4);
      });


      it('should return 5 for regular job CREATED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.JOB,
          data: { state: 'CREATED', kind: 'BPMN_ELEMENT' },
          timestamp: 0
        })).to.equal(5);
      });


      it('should return 5 for user-task CREATED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.USER_TASK,
          data: { state: 'CREATED' },
          timestamp: 0
        })).to.equal(5);
      });


      it('should return 5 for message-subscription CREATED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION,
          data: { messageSubscriptionState: 'CREATED' },
          timestamp: 0
        })).to.equal(5);
      });


      it('should return 6 for regular job COMPLETED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.JOB,
          data: { state: 'COMPLETED', kind: 'BPMN_ELEMENT' },
          timestamp: 0
        })).to.equal(6);
      });


      it('should return 6 for user-task COMPLETED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.USER_TASK,
          data: { state: 'COMPLETED' },
          timestamp: 0
        })).to.equal(6);
      });


      it('should return 6 for message-subscription CORRELATED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION,
          data: { messageSubscriptionState: 'CORRELATED' },
          timestamp: 0
        })).to.equal(6);
      });


      it('should return 10 for other status entries', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.STATUS,
          status: EXECUTION_LOG_ENTRY_STATUS.COMPLETED,
          timestamp: 0
        })).to.equal(10);
      });


      it('should return 7 for end execution listener job CREATED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.JOB,
          data: { state: 'CREATED', kind: 'EXECUTION_LISTENER', listenerEventType: 'END' },
          timestamp: 0
        })).to.equal(7);
      });


      it('should return 8 for end execution listener job COMPLETED', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.JOB,
          data: { state: 'COMPLETED', kind: 'EXECUTION_LISTENER', listenerEventType: 'END' },
          timestamp: 0
        })).to.equal(8);
      });


      it('should return 9 for completed element instances', function() {
        expect(getEntryOrder({
          type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE,
          data: { state: 'COMPLETED' },
          timestamp: 0
        })).to.equal(9);
      });

    });


    describe('areRelated', function() {

      it('should return true for entries sharing the same elementId', function() {
        const a = { type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE, data: { elementId: 'Task_1', state: 'ACTIVE' }, timestamp: 0 };
        const b = { type: EXECUTION_LOG_ENTRY_TYPE.JOB, data: { elementId: 'Task_1', state: 'CREATED' }, timestamp: 0 };

        expect(areRelated(a, b)).to.be.true;
      });


      it('should return false for entries with different elementIds', function() {
        const a = { type: EXECUTION_LOG_ENTRY_TYPE.JOB, data: { elementId: 'Task_A', state: 'COMPLETED' }, timestamp: 0 };
        const b = { type: EXECUTION_LOG_ENTRY_TYPE.JOB, data: { elementId: 'Task_B', state: 'CREATED' }, timestamp: 0 };

        expect(areRelated(a, b)).to.be.false;
      });


      it('should return true for same-type job entries sharing jobKey', function() {
        const a = { type: EXECUTION_LOG_ENTRY_TYPE.JOB, data: { jobKey: '42', state: 'CREATED' }, timestamp: 0 };
        const b = { type: EXECUTION_LOG_ENTRY_TYPE.JOB, data: { jobKey: '42', state: 'COMPLETED' }, timestamp: 0 };

        expect(areRelated(a, b)).to.be.true;
      });


      it('should return true for same-type user-task entries sharing userTaskKey', function() {
        const a = { type: EXECUTION_LOG_ENTRY_TYPE.USER_TASK, data: { userTaskKey: '7', state: 'CREATED' }, timestamp: 0 };
        const b = { type: EXECUTION_LOG_ENTRY_TYPE.USER_TASK, data: { userTaskKey: '7', state: 'COMPLETED' }, timestamp: 0 };

        expect(areRelated(a, b)).to.be.true;
      });


      it('should return true for same-type message-subscription entries sharing messageSubscriptionKey', function() {
        const a = { type: EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION, data: { messageSubscriptionKey: '3', messageSubscriptionState: 'CREATED' }, timestamp: 0 };
        const b = { type: EXECUTION_LOG_ENTRY_TYPE.MESSAGE_SUBSCRIPTION, data: { messageSubscriptionKey: '3', messageSubscriptionState: 'CORRELATED' }, timestamp: 0 };

        expect(areRelated(a, b)).to.be.true;
      });


      it('should return false for entries without elementId or matching keys', function() {
        const a = { type: EXECUTION_LOG_ENTRY_TYPE.USER_TASK, data: { userTaskKey: '1', state: 'CREATED' }, timestamp: 0 };
        const b = { type: EXECUTION_LOG_ENTRY_TYPE.ELEMENT_INSTANCE, data: { state: 'ACTIVE' }, timestamp: 0 };

        expect(areRelated(a, b)).to.be.false;
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