/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

import Modeler from 'bpmn-js-headless/lib/Modeler';
import zeebeModdleExtension from 'zeebe-bpmn-moddle/resources/zeebe.json';
import { ZeebeVariableResolverModule } from '@bpmn-io/variable-resolver';

const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:modeler="http://camunda.org/schema/modeler/1.0" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Camunda Web Modeler" exporterVersion="dev" modeler:executionPlatform="Camunda Cloud" modeler:executionPlatformVersion="8.4.0">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="150" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

let modeler;

export function bootstrapModeler(xml = initialDiagram, options = {}) {
  return function() {
    if (modeler) {
      modeler.destroy();
    }

    const modules = [
      ZeebeVariableResolverModule
    ];

    const { additionalModules = [] } = options;

    modeler = new Modeler({
      moddleExtensions: {
        zeebe: zeebeModdleExtension
      },
      additionalModules: modules.concat(additionalModules)
    });

    return modeler.importXML(xml);
  };
}

export function inject(fn) {
  return function() {
    if (!modeler) {
      throw new Error('Modeler not initialized. Call bootstrapModeler() first.');
    }

    return modeler.invoke(fn);
  };
}

export function getModeler() {
  return modeler;
}