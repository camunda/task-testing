import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil.js';

export function getInputMapping(element) {
  const businessObject = getBusinessObject(element);
  const extensionElements = businessObject?.get('extensionElements');
  const ioMapping = extensionElements?.get('values').filter(value => is(value, 'zeebe:IoMapping'))[0];
  return ioMapping?.get('inputParameters');
}

