import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

export function getName(element) {
  const businessObject = getBusinessObject(element);

  const name = businessObject.get('name') || businessObject.get('id');

  if (name.length > 30) {
    return `${name.substring(0, 27)}...`;
  }

  return name;
}