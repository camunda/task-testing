// Test the FEEL analyzer integration in the browser console
// You can paste this into the browser developer console to test the functionality

// Simulate an element with FEEL expressions
const testElement = {
  id: 'TestTask_1',
  type: 'bpmn:ServiceTask',
  businessObject: {
    $type: 'bpmn:ServiceTask',
    id: 'TestTask_1', 
    extensionElements: {
      values: [
        {
          $type: 'zeebe:IoMapping',
          inputParameters: [
            {
              source: '= age >= 18',
              target: 'isAdult'
            },
            {
              source: '= firstName + " " + lastName',
              target: 'fullName'
            }
          ],
          outputParameters: [
            {
              source: '= if salary > 50000 then "high" else "low"',
              target: 'salaryCategory'
            }
          ]
        },
        {
          $type: 'zeebe:TaskHeaders',
          values: [
            {
              key: 'retryCount',
              value: '= retryAttempts + 1'
            }
          ]
        }
      ]
    }
  }
};

console.log('🧪 Test Element:', testElement);
console.log('Expected variables: age, firstName, lastName, salary, retryAttempts');