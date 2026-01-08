const input = {
  'ServiceTask_1': JSON.stringify({
    a: 'abc',
    b: 2,
    c: {
      d: 3,
      e: 4,
      f: [ 5, 6, 7 ]
    },
    d: false
  }, null, 2),
  'ServiceTask_2': JSON.stringify({
    foo: 1,
    bar: 'baz'
  }, null, 2)
};

const output = {
  'ServiceTask_1': {
    success: true,
    variables: {
      '2251799814704816': {
        'name': 'a',
        'value': 'abc',
        'scope': 'PROCESS'
      },
      '2251799814704817': {
        'name': 'b',
        'value': 2,
        'scope': 'PROCESS'
      },
      '2251799814704818': {
        'name': 'c',
        'value': {
          'd': 3,
          'e': 4,
          'f': [
            5,
            6,
            7
          ]
        },
        'scope': 'PROCESS'
      },
      '2251799814704819': {
        'name': 'd',
        'value': false,
        'scope': 'PROCESS'
      },
      '2251799814704823': {
        'name': 'fooPlusOne',
        'value': null,
        'scope': 'LOCAL'
      },
      '2251799814704824': {
        'name': 'output3',
        'value': {
          'foo': 1
        },
        'scope': 'PROCESS'
      },
      '2251799814704825': {
        'name': 'output1',
        'value': 1,
        'scope': 'PROCESS'
      },
      '2251799814704826': {
        'name': 'fooPlusOneOutput',
        'value': null,
        'scope': 'PROCESS'
      },
      '2251799814704827': {
        'name': 'output4',
        'value': 'foo',
        'scope': 'PROCESS'
      },
      '2251799814704828': {
        'name': 'output2',
        'value': true,
        'scope': 'PROCESS'
      },
      'RPA_Result': 'someURL'
    },
    operateUrl: 'https://camunda.com'
  },
  'ServiceTask_2': {
    success: false,
    error: {
      message: 'Network error',
      response: 'Could not reach the endpoint'
    }
  },
  'ServiceTask_4': {
    'success': false,
    'incident': {
      'processDefinitionId': 'Process_TaskTesting',
      'errorType': 'JOB_NO_RETRIES',
      'errorMessage': 'jakarta.validation.ValidationException: Found constraints violated while validating input: \n - Property: data.smtpAction.subject: Validation failed. Original message: must not be null\n - Property: data.smtpAction.emailMessageValid: Validation failed. Original message: Please provide a proper message body\n - Property: authentication.password: Validation failed. Original message: must not be blank\n - Property: data.smtpConfig.smtpHost: Validation failed. Original message: must not be null\n - Property: data.smtpAction.from: Validation failed. Original message: must not be null\n - Property: authentication.username: Validation failed. Original message: must not be blank\n - Property: data.smtpAction.to: Validation failed. Original message: must not be null',
      'elementId': 'ServiceTask_4',
      'creationTime': '2025-12-08T16:01:40.097Z',
      'state': 'ACTIVE',
      'tenantId': '<default>',
      'incidentKey': '2251799814724316',
      'processDefinitionKey': '2251799814724306',
      'processInstanceKey': '2251799814724307',
      'elementInstanceKey': '2251799814724308',
      'jobKey': '2251799814724313'
    },
    'variables': {
      'readTimeoutInSeconds': 20,
      'method': 'GET',
      'ignoreNullValues': false,
      'authentication': {
        'type': 'noAuth'
      },
      'url': 'https://camunda.foobar',
      'storeResponse': false,
      'connectionTimeoutInSeconds': 20,
      'error': {
        'code': '502',
        'variables': {
          'response': {
            'headers': {
              'Content-Length': '88',
              'X-Smokescreen-Error': 'Failed to resolve remote hostname: lookup camunda.foobar on 10.44.0.10:53: no such host',
              'Content-Type': 'text/plain'
            },
            'body': 'Failed to resolve remote hostname: lookup camunda.foobar on 10.44.0.10:53: no such host\n'
          }
        },
        'message': 'Bad gateway',
        'type': 'io.camunda.connector.api.error.ConnectorException'
      }
    },
    operateUrl: 'https://camunda.com'
  }
};

export default {
  input,
  output
};