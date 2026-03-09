import { getVariables, SCOPES } from '../../lib/utils/variables';

import { createVariableDetails } from '../helpers/responses';

describe('utils/variables', function() {

  describe('#getVariables', function() {

    it('should get variables with scope', function() {

      // given
      const getVariablesResponseItems = [
        createVariableDetails({
          variableKey: '1',
          name: 'localFoo',
          value: 'bar',
          scopeKey: '1'
        }),
        createVariableDetails({
          variableKey: '2',
          name: 'localBaz',
          value: 42,
          scopeKey: '1'
        }),
        createVariableDetails({
          variableKey: '3',
          name: 'processFoo',
          value: true,
          scopeKey: '1'
        }),
        createVariableDetails({
          variableKey: '4',
          name: 'processFoo',
          value: true,
          scopeKey: '2'
        }),
        createVariableDetails({
          variableKey: '5',
          name: 'otherLocalFoo',
          value: 'baz',
          scopeKey: '3'
        })
      ];

      const getElementInstancesResponseItems = [
        {
          elementId: 'ServiceTask_1',
          elementInstanceKey: '1'
        }
      ];

      // when
      const variables = getVariables(
        getVariablesResponseItems,
        getElementInstancesResponseItems,
        '2',
        'ServiceTask_1'
      );

      // then
      expect(variables).to.eql({
        '1': { name: 'localFoo', value: 'bar', scope: SCOPES.LOCAL },
        '2': { name: 'localBaz', value: 42, scope: SCOPES.LOCAL },
        '3': { name: 'processFoo', value: true, scope: SCOPES.LOCAL },
        '4': { name: 'processFoo', value: true, scope: SCOPES.PROCESS },
        '5': { name: 'otherLocalFoo', value: 'baz', scope: null }
      });
    });

  });

});