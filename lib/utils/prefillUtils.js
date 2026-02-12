import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import { FeelAnalyzer } from '@bpmn-io/feel-analyzer';
import { camundaBuiltins, camundaReservedNameBuiltins } from '@camunda/feel-builtins';

/**
 * Generate prefill input by analyzing FEEL expressions in an element
 * Merges with existing input, respecting non-null user values
 *
 * @param {Object} element - The BPMN element to analyze
 * @param {string} [currentInput='{}'] - Current input JSON string
 * @returns {string|null} - JSON string of prefilled input, or null if nothing to prefill
 */
export function generatePrefillInput(element, currentInput = '{}') {
  if (!element) {
    return null;
  }

  try {
    const feelExpressions = extractFeelExpressions(element);

    if (feelExpressions.length === 0) {
      return null;
    }

    // Analyze FEEL expressions and extract needed variables
    const analyzer = new FeelAnalyzer({
      parserDialect: 'camunda',
      builtins: camundaBuiltins,
      reservedNameBuiltins: camundaReservedNameBuiltins
    });
    const allNeededVariables = new Set();
    const analysisResults = [];

    feelExpressions.forEach((exprData) => {
      try {
        const result = analyzer.analyzeExpression(exprData.expression);
        analysisResults.push({
          ...exprData,
          analysis: result,
        });

        if (result.inputs) {
          Object.keys(result.inputs).forEach((variable) => {
            allNeededVariables.add(variable);
          });
        }
      } catch (error) {

        // Silently ignore analysis errors
        analysisResults.push({
          ...exprData,
          analysis: null,
          error: error.message,
        });
      }
    });

    if (allNeededVariables.size === 0) {
      return null;
    }

    // Parse current input to check for existing user values
    let currentInputData = {};
    try {
      currentInputData = currentInput ? JSON.parse(currentInput) : {};
    } catch {

      // If current input is invalid JSON, start fresh
      currentInputData = {};
    }

    // Build prefill structure from analyzer outputs
    // Merge type info for the same variables across different expressions
    const mergedTypeInfo = {};
    analysisResults.forEach((result) => {
      if (result.analysis?.inputs) {
        Object.entries(result.analysis.inputs).forEach(([ variable, typeInfo ]) => {
          if (variable in mergedTypeInfo) {
            mergedTypeInfo[variable] = mergeTypeInfo(mergedTypeInfo[variable], typeInfo);
          } else {
            mergedTypeInfo[variable] = typeInfo;
          }
        });
      }
    });

    const prefillData = {};
    Object.entries(mergedTypeInfo).forEach(([ variable, typeInfo ]) => {

      // Only add if not already set by user (respect non-null values)
      if (!(variable in currentInputData) || currentInputData[variable] === null || currentInputData[variable] === undefined) {
        prefillData[variable] = buildValueFromTypeInfo(typeInfo);
      }
    });

    // Build final input: only include variables that are currently needed
    // This ensures old/renamed variables are removed
    const finalData = {};

    // First, add all prefilled variables
    Object.entries(prefillData).forEach(([ variable, value ]) => {
      finalData[variable] = value;
    });

    // Then, preserve user values only for variables that are still referenced
    Object.entries(currentInputData).forEach(([ variable, value ]) => {
      if (allNeededVariables.has(variable)) {

        // Keep user value if it's still referenced
        if (value !== null && value !== undefined) {
          finalData[variable] = value;
        }
      }

      // Otherwise, the variable is no longer referenced, so don't include it
    });

    return JSON.stringify(finalData, null, 2);
  } catch (error) {
    console.error('Error generating prefill input:', error);
    return null;
  }
}


/**
 * Extract FEEL expressions from a BPMN element
 * @param {Object} element - BPMN element
 * @returns {Array} - Array of FEEL expressions with their paths and types
 */
function extractFeelExpressions(element) {
  const feelExpressions = [];
  const businessObject = getBusinessObject(element);
  const seenExpressions = new Map();

  const isFeelExpression = (str) => {
    if (typeof str !== 'string') return false;
    return str.startsWith('=') || str.includes('${') || /\b(if|then|else|for|some|every|and|or|not|null|true|false)\b/.test(str);
  };

  const addExpression = (path, expression, type) => {
    const key = `${path}::${expression}`;
    if (!seenExpressions.has(key)) {
      seenExpressions.set(key, true);
      feelExpressions.push({
        path,
        expression,
        type,
      });
    }
  };

  const extractFromObject = (obj, path = '', excludePaths = new Set()) => {
    if (!obj) return;

    for (const [ key, value ] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (excludePaths.has(currentPath)) continue;

      if (typeof value === 'string' && isFeelExpression(value)) {
        addExpression(currentPath, value, 'property');
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayPath = `${currentPath}[${index}]`;
          if (excludePaths.has(arrayPath)) return;

          if (typeof item === 'string' && isFeelExpression(item)) {
            addExpression(arrayPath, item, 'array_item');
          } else if (typeof item === 'object') {
            extractFromObject(item, arrayPath, excludePaths);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        extractFromObject(value, currentPath, excludePaths);
      }
    }
  };

  const excludePaths = new Set();
  if (businessObject.extensionElements) {
    const extensionElements = businessObject.extensionElements.values || [];
    extensionElements.forEach((extension, extensionIndex) => {
      if (extension.$type === 'zeebe:IoMapping') {
        extension.inputParameters?.forEach((input, inputIndex) => {
          excludePaths.add(`businessObject.extensionElements.values[${extensionIndex}].inputParameters[${inputIndex}].source`);
        });

        extension.outputParameters?.forEach((output, outputIndex) => {
          excludePaths.add(`businessObject.extensionElements.values[${extensionIndex}].outputParameters[${outputIndex}].source`);
        });
      }
      if (extension.$type === 'zeebe:TaskHeaders') {
        extension.values?.forEach((header, headerIndex) => {
          excludePaths.add(`businessObject.extensionElements.values[${extensionIndex}].values[${headerIndex}].value`);
        });
      }
      if (extension.$type === 'zeebe:TaskDefinition') {
        excludePaths.add(`businessObject.extensionElements.values[${extensionIndex}].type`);
      }
    });
  }

  extractFromObject(businessObject, 'businessObject', excludePaths);

  if (businessObject.extensionElements) {
    const extensionElements = businessObject.extensionElements.values || [];

    extensionElements.forEach((extension, extensionIndex) => {
      const extensionPath = `extensionElements[${extensionIndex}]`;

      if (extension.$type === 'zeebe:IoMapping') {
        extension.inputParameters?.forEach((input, inputIndex) => {
          if (input.source && isFeelExpression(input.source)) {
            addExpression(`${extensionPath}.inputParameters[${inputIndex}].source`, input.source, 'zeebe_input_mapping');
          }
        });
      }

      if (extension.$type === 'zeebe:TaskDefinition') {
        if (extension.type && isFeelExpression(extension.type)) {
          addExpression(`${extensionPath}.type`, extension.type, 'zeebe_task_type');
        }
      }

      if (extension.$type === 'zeebe:TaskHeaders') {
        extension.values?.forEach((header, headerIndex) => {
          if (header.value && isFeelExpression(header.value)) {
            addExpression(`${extensionPath}.values[${headerIndex}].value`, header.value, 'zeebe_task_header');
          }
        });
      }
    });
  }

  return feelExpressions;
}

/**
 * Merge two type info objects, combining properties for context types
 */
function mergeTypeInfo(typeInfo1, typeInfo2) {
  if (!typeInfo1) return typeInfo2;
  if (!typeInfo2) return typeInfo1;

  // If both are contexts, merge their properties
  if (typeInfo1.type === 'context' && typeInfo2.type === 'context') {
    const mergedProperties = { ...typeInfo1.properties };

    if (typeInfo2.properties) {
      Object.entries(typeInfo2.properties).forEach(([ key, propTypeInfo ]) => {
        if (key in mergedProperties) {
          mergedProperties[key] = mergeTypeInfo(mergedProperties[key], propTypeInfo);
        } else {
          mergedProperties[key] = propTypeInfo;
        }
      });
    }

    return {
      ...typeInfo1,
      properties: mergedProperties
    };
  }

  // For non-context types, prefer the second one (most recent)
  return typeInfo2;
}

/**
 * Build value from analyzer's type info
 */
function buildValueFromTypeInfo(typeInfo) {
  if (!typeInfo) {
    return null;
  }

  if (typeInfo.type === 'context' && typeInfo.properties) {
    const obj = {};

    Object.entries(typeInfo.properties).forEach(([ key, propTypeInfo ]) => {
      obj[key] = buildValueFromTypeInfo(propTypeInfo);
    });

    return obj;
  }

  return null;
}
