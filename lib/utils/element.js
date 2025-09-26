import { getLabel } from 'bpmn-js/lib/features/label-editing/LabelUtil';

export function getName(element) {
  return getLabel(element);
};

export function getType(element, injector) {
  const translate = injector.get('translate') || ((text) => text);

  const elementTemplates = injector.get('elementTemplates', false);

  if (elementTemplates) {
    const template = getTemplate(element, elementTemplates);

    if (template && template.name) {
      return translate(template.name);
    }
  }

  const concreteType = getConcreteType(element);

  return translate(concreteType.replace(/(\B[A-Z])/g, ' $1'));
};

function getTemplate(element, elementTemplates) {
  return elementTemplates.get(element);
}

export function getConcreteType(element) {
  return element.type.split(':')[1];
}