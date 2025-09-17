import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Get the name of a BPMN element.
 *
 * @param {import('../types').Element} element
 *
 * @returns {string}
 */
export function getName(element) {
  const businessObject = getBusinessObject(element);

  const name = businessObject.get('name') || businessObject.get('id');

  if (name.length > 30) {
    return `${name.substring(0, 27)}...`;
  }

  return name;
}

/**
 * Get the name of a BPMN element.
 *
 * @param {import('../types').Element} element
 *
 * @returns {string}
 */
export function getType(element) {
  const businessObject = getBusinessObject(element);

  const { $type: type } = businessObject;

  switch (type) {
  case 'bpmn:Task':
    return 'Task';
  case 'bpmn:UserTask':
    return 'User Task';
  case 'bpmn:ScriptTask':
    return 'Script Task';
  case 'bpmn:ServiceTask':
    return 'Service Task';
  case 'bpmn:BusinessRuleTask':
    return 'Business Rule Task';
  case 'bpmn:SendTask':
    return 'Send Task';
  case 'bpmn:ManualTask':
    return 'Manual Task';
  case 'bpmn:ReceiveTask':
    return 'Receive Task';
  default:
    return 'Task';
  }
}