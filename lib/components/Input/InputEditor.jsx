import React, { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { defaultKeymap } from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { Compartment, EditorState, Annotation } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { linter } from "@codemirror/lint";
import { json, jsonParseLinter } from "@codemirror/lang-json";

import classNames from "classnames";

import { forEach, has, isObject } from "min-dash";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { FeelAnalyzer } from "@bpmn-io/feel-analyzer";

import theme from "../shared/CodeMirrorTheme";

import { getAutocompletionExtensions } from "../../utils/autocompletion";

import { SCOPES } from "../../TaskExecution";

const fromPropAnnotation = Annotation.define();

const autocompletionCompartment = new Compartment();

export const PLACEHOLDER_TEXT = "Enter process variables in JSON format";

export const INVALID_JSON_ERROR = "JSON contains errors";

const DEFAULT_ALL_OUTPUTS = {},
  DEFAULT_VARIABLES_FOR_ELEMENT = [];

export default function InputEditor({
  allOutputs = DEFAULT_ALL_OUTPUTS,
  element,
  value,
  onChange,
  onErrorChange,
  variablesForElement = DEFAULT_VARIABLES_FOR_ELEMENT,
}) {
  const autocompletions = useMemo(() => {
    const variablesForElementAutocompletions = variablesForElement.map(
      ({ name, detail, info }) => ({
        label: name,
        type: "variable",
        info: () => getAutocompletionInfo(info, "Process variable"),
        detail,
        value: info ? info : undefined,
      }),
    );

    const allOutputVariables = getAllOutputVariables(allOutputs);

    const outputVariablesAutocompletions = allOutputVariables.map(
      ({ name, value, origin }) => ({
        label: name,
        type: "variable",
        info: () =>
          getAutocompletionInfo(value, `Output variable from ${origin}`),
        detail: getDetail(value),
        value,
      }),
    );

    /**
     * @type {import('@codemirror/autocomplete').Completion[]}
     */
    const result = [
      ...variablesForElementAutocompletions,
      ...outputVariablesAutocompletions,
    ];

    return result;
  }, [allOutputs, variablesForElement]);

  const ref = useRef(null);

  /**
   * @type {ReturnType<typeof useState<EditorView>>}
   */
  const [editorView, setEditorView] = useState();

  /**
   * @type {ReturnType<typeof useState<string?>>}
   */
  const [error, setError] = useState();

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const source = (view) => {
      const errors = jsonParseLinter()(view);

      const hasError = errors && errors.length > 0;

      onErrorChange(hasError ? INVALID_JSON_ERROR : null);

      setError(hasError ? INVALID_JSON_ERROR : null);

      return errors;
    };

    const editorState = EditorState.create({
      doc: value,
      extensions: [
        autocompletion(),
        closeBrackets(),
        bracketMatching(),
        indentOnInput(),
        keymap.of([...defaultKeymap]),
        new Compartment().of(json()),
        new Compartment().of(EditorState.tabSize.of(2)),
        EditorView.contentAttributes.of({
          "aria-label": "JSON editor",
          tabindex: "0",
        }),
        linter(source, { delay: 300 }),
        autocompletionCompartment.of(
          getAutocompletionExtensions(autocompletions),
        ),
        placeholder(PLACEHOLDER_TEXT),
        theme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            if (
              update.transactions.some((transaction) =>
                transaction.annotation(fromPropAnnotation),
              )
            ) {
              return;
            }

            const newValue = update.state.doc.toString();

            onChange(newValue);
          }
        }),
      ],
    });

    const view = new EditorView({
      state: editorState,
      parent: ref.current,
    });

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, [onChange]);

  useEffect(() => {
    if (!editorView) return;

    editorView.dispatch({
      effects: autocompletionCompartment.reconfigure(
        getAutocompletionExtensions(autocompletions),
      ),
    });
  }, [autocompletions, editorView]);

  useEffect(() => {
    if (!editorView) return;

    const editorValue = editorView.state.doc.toString();

    if (value !== editorValue) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorValue.length,
          insert: value,
        },
        annotations: fromPropAnnotation.of(true),
      });
    }
  }, [editorView, value]);

  const handleDebugElement = () => {
    if (!element) {
      console.log("No element selected");
      return;
    }

    console.log("Current Element:", element);
    console.log("Element ID:", element.id);
    console.log("Element Type:", element.type);

    const feelExpressions = extractFeelExpressions(element);
    console.log("FEEL Expressions:", feelExpressions);

    // Analyze FEEL expressions and extract needed variables
    const analyzer = new FeelAnalyzer();
    const allNeededVariables = new Set();
    const analysisResults = [];

    feelExpressions.forEach((exprData) => {
      try {
        const analysis = analyzer.analyze(exprData.expression);
        analysisResults.push({
          ...exprData,
          analysis,
        });

        if (analysis.neededInputs) {
          analysis.neededInputs.forEach((variable) => {
            allNeededVariables.add(variable);
          });
        }
      } catch (error) {
        console.warn(
          `Failed to analyze expression "${exprData.expression}":`,
          error,
        );
        analysisResults.push({
          ...exprData,
          analysis: null,
          error: error.message,
        });
      }
    });

    console.log("Analysis Results:", analysisResults);
    console.log(
      "Deduplicated Variables Needed:",
      Array.from(allNeededVariables).sort(),
    );

    // Prefill input with discovered variables
    if (allNeededVariables.size > 0) {
      const inputData = {};
      const typeAnalysis = analyzeVariableTypes(
        Array.from(allNeededVariables),
        analysisResults,
      );

      // Create input structure based on discovered variables and their types
      Array.from(allNeededVariables)
        .sort()
        .forEach((variable) => {
          // Handle nested variables (e.g., "person.address.city")
          if (variable.includes(".")) {
            const parts = variable.split(".");
            let current = inputData;

            // Create nested structure
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (!current[part]) {
                current[part] = {};
              }
              current = current[part];
            }

            // Set the final value based on type inference from analysis
            const finalKey = parts[parts.length - 1];
            const typeInfo = typeAnalysis.variableTypes[variable];
            current[finalKey] = getDefaultValueForType(typeInfo);
          } else {
            // Simple variable
            const typeInfo = typeAnalysis.variableTypes[variable];
            inputData[variable] = getDefaultValueForType(typeInfo);
          }
        });

      const jsonString = JSON.stringify(inputData, null, 2);

      console.group("📝 Prefilling Input");
      console.log("Generated input data:", jsonString);
      console.groupEnd();

      // Update the editor with the prefilled data
      onChange(jsonString);
    }

    // Enhanced summary with type analysis
    const typeAnalysis = analyzeVariableTypes(
      Array.from(allNeededVariables),
      analysisResults,
    );

    console.group("🔍 FEEL Analysis Summary");
    console.log(`📊 Total expressions found: ${feelExpressions.length}`);
    console.log(
      `✅ Successfully analyzed: ${analysisResults.filter((r) => r.analysis).length}`,
    );
    console.log(
      `❌ Failed to analyze: ${analysisResults.filter((r) => !r.analysis).length}`,
    );
    console.log(`📝 Unique variables needed: ${allNeededVariables.size}`);
    console.log(
      `🏷️  Variables: [${Array.from(allNeededVariables).sort().join(", ")}]`,
    );

    // Type determination details
    if (allNeededVariables.size > 0) {
      console.log("\n🎯 Type Determination:");
      Array.from(allNeededVariables)
        .sort()
        .forEach((variable) => {
          const info = typeAnalysis.variableTypes[variable];
          const sources = typeAnalysis.typeSources[variable] || [];

          if (info?.hasConflict) {
            console.log(
              `⚠️  ${variable}: CONFLICT! Found types: ${info.conflictingTypes.join(", ")}`,
            );
            console.log(
              `   📍 Sources: ${sources.map((s) => `"${s.expression}" (${s.type})`).join(", ")}`,
            );
            console.log(
              `   ✅ Resolved to: ${info.resolvedType || "string (fallback)"}`,
            );
          } else {
            console.log(
              `✅ ${variable}: ${info?.type || "string (no type info)"}`,
            );
            if (sources.length > 0) {
              console.log(
                `   📍 From: ${sources.map((s) => `"${s.expression}"`).join(", ")}`,
              );
            }
          }
        });

      if (typeAnalysis.conflictCount > 0) {
        console.log(
          `\n⚠️  Type Conflicts Found: ${typeAnalysis.conflictCount}`,
        );
        console.log(
          "   Resolution Strategy: Most specific type wins (number > boolean > string)",
        );
      }

      console.log("🚀 Input prefilled with discovered variables!");
    }
    console.groupEnd();
  };

  return (
    <div
      className={classNames("code__editor", { "code__editor--error": error })}
    >
      <div className="code__editor-codemirror">
        <div ref={ref} className="code__editor-codemirror-inner"></div>
      </div>
      {error && <div className="code__editor-error">{error}</div>}
      {element && (
        <button
          onClick={handleDebugElement}
          style={{
            marginTop: "8px",
            padding: "4px 8px",
            backgroundColor: "#0f62fe",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Debug & Prefill Input
        </button>
      )}
    </div>
  );
}

function extractFeelExpressions(element) {
  const feelExpressions = [];
  const businessObject = getBusinessObject(element);
  const seenExpressions = new Map(); // Track expression+path combinations to avoid duplicates

  // Helper function to check if a string contains FEEL expression
  const isFeelExpression = (str) => {
    if (typeof str !== "string") return false;
    // FEEL expressions often start with = or contain FEEL syntax
    return (
      str.startsWith("=") ||
      str.includes("${") ||
      /\b(if|then|else|for|some|every|and|or|not|null|true|false)\b/.test(str)
    );
  };

  // Helper function to add expression if not already seen
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

  // Helper function to recursively extract FEEL expressions from an object
  const extractFromObject = (obj, path = "", excludePaths = new Set()) => {
    if (!obj) return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Skip if this path should be excluded (to avoid double processing)
      if (excludePaths.has(currentPath)) continue;

      if (typeof value === "string" && isFeelExpression(value)) {
        addExpression(currentPath, value, "property");
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayPath = `${currentPath}[${index}]`;
          if (excludePaths.has(arrayPath)) return;

          if (typeof item === "string" && isFeelExpression(item)) {
            addExpression(arrayPath, item, "array_item");
          } else if (typeof item === "object") {
            extractFromObject(item, arrayPath, excludePaths);
          }
        });
      } else if (typeof value === "object" && value !== null) {
        extractFromObject(value, currentPath, excludePaths);
      }
    }
  };

  // Build exclusion set for paths that will be handled specifically
  const excludePaths = new Set();
  if (businessObject.extensionElements) {
    const extensionElements = businessObject.extensionElements.values || [];
    extensionElements.forEach((extension, extensionIndex) => {
      if (extension.$type === "zeebe:IoMapping") {
        extension.inputParameters?.forEach((input, inputIndex) => {
          excludePaths.add(
            `businessObject.extensionElements.values[${extensionIndex}].inputParameters[${inputIndex}].source`,
          );
        });
        // Exclude output parameters from recursive processing (we ignore them completely)
        extension.outputParameters?.forEach((output, outputIndex) => {
          excludePaths.add(
            `businessObject.extensionElements.values[${extensionIndex}].outputParameters[${outputIndex}].source`,
          );
        });
      }
      if (extension.$type === "zeebe:TaskHeaders") {
        extension.values?.forEach((header, headerIndex) => {
          excludePaths.add(
            `businessObject.extensionElements.values[${extensionIndex}].values[${headerIndex}].value`,
          );
        });
      }
      if (extension.$type === "zeebe:TaskDefinition") {
        excludePaths.add(
          `businessObject.extensionElements.values[${extensionIndex}].type`,
        );
      }
    });
  }

  // Extract from main business object (excluding paths that will be handled specifically)
  extractFromObject(businessObject, "businessObject", excludePaths);

  // Check Zeebe-specific properties with more specific types
  if (businessObject.extensionElements) {
    const extensionElements = businessObject.extensionElements.values || [];

    extensionElements.forEach((extension, extensionIndex) => {
      const extensionPath = `extensionElements[${extensionIndex}]`;

      // Check for Zeebe IO mappings
      if (extension.$type === "zeebe:IoMapping") {
        // Only process input parameters - they define what variables are needed as inputs
        extension.inputParameters?.forEach((input, inputIndex) => {
          if (input.source && isFeelExpression(input.source)) {
            addExpression(
              `${extensionPath}.inputParameters[${inputIndex}].source`,
              input.source,
              "zeebe_input_mapping",
            );
          }
        });

        // Skip output parameters - they define output mappings, not input requirements
        // extension.outputParameters are ignored for input prefilling
      }

      // Check for Zeebe task definition
      if (extension.$type === "zeebe:TaskDefinition") {
        if (extension.type && isFeelExpression(extension.type)) {
          addExpression(
            `${extensionPath}.type`,
            extension.type,
            "zeebe_task_type",
          );
        }
      }

      // Check for Zeebe task headers
      if (extension.$type === "zeebe:TaskHeaders") {
        extension.values?.forEach((header, headerIndex) => {
          if (header.value && isFeelExpression(header.value)) {
            addExpression(
              `${extensionPath}.values[${headerIndex}].value`,
              header.value,
              "zeebe_task_header",
            );
          }
        });
      }
    });
  }

  return feelExpressions;
}

// Analyze variable types across all expressions and detect conflicts
function analyzeVariableTypes(variables, analysisResults) {
  const typeMap = new Map(); // variable -> Array of {type, expression, source}
  const variableTypes = {};
  const typeSources = {};
  let conflictCount = 0;

  // Collect all type information for each variable
  variables.forEach((variable) => {
    const types = [];

    analysisResults.forEach((result) => {
      if (result.analysis?.inputTypes?.[variable]) {
        const typeInfo = result.analysis.inputTypes[variable];
        types.push({
          type: typeInfo.type,
          expression: result.expression,
          source: result.path,
        });
      }
    });

    typeMap.set(variable, types);
    typeSources[variable] = types;

    if (types.length === 0) {
      // No type information found
      variableTypes[variable] = { type: "string", resolvedType: "string" };
    } else if (types.length === 1) {
      // Single type found
      variableTypes[variable] = {
        type: types[0].type,
        resolvedType: types[0].type,
      };
    } else {
      // Multiple types found - check for conflicts
      const uniqueTypes = [...new Set(types.map((t) => t.type))];

      if (uniqueTypes.length === 1) {
        // All expressions agree on the type
        variableTypes[variable] = {
          type: uniqueTypes[0],
          resolvedType: uniqueTypes[0],
        };
      } else {
        // Type conflict detected
        conflictCount++;
        const resolvedType = resolveTypeConflict(uniqueTypes);

        variableTypes[variable] = {
          type: resolvedType,
          resolvedType,
          hasConflict: true,
          conflictingTypes: uniqueTypes,
        };
      }
    }
  });

  return {
    variableTypes,
    typeSources,
    conflictCount,
    typeMap,
  };
}

// Resolve type conflicts using a hierarchy: number > boolean > string > others
function resolveTypeConflict(types) {
  const hierarchy = [
    "number",
    "boolean",
    "string",
    "array",
    "object",
    "date",
    "time",
    "date-time",
  ];

  for (const preferredType of hierarchy) {
    if (types.includes(preferredType)) {
      return preferredType;
    }
  }

  // Fallback to first type if none match hierarchy
  return types[0] || "string";
}

// Helper function to infer variable type from analysis results (legacy - now uses analyzeVariableTypes)
function getVariableTypeFromAnalysis(variable, analysisResults) {
  for (const result of analysisResults) {
    if (result.analysis?.inputTypes?.[variable]) {
      return result.analysis.inputTypes[variable];
    }
  }
  return null;
}

// Helper function to generate default values based on inferred type
function getDefaultValueForType(typeInfo) {
  if (!typeInfo?.type) {
    return ""; // Default to empty string if no type info
  }

  switch (typeInfo.type) {
    case "number":
      return 0;
    case "string":
      return "";
    case "boolean":
      return false;
    case "array":
    case "list":
      return [];
    case "object":
    case "context":
      return {};
    case "date":
      return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    case "time":
      return "12:00:00";
    case "date-time":
      return new Date().toISOString();
    case "duration":
      return "PT1H"; // ISO 8601 duration format
    default:
      // For unknown types or complex types, use empty string
      return "";
  }
}

function getAutocompletionInfo(value, description) {
  const div = document.createElement("div");

  const htmlString = renderToStaticMarkup(
    <div className="info">
      <span>{description}</span>
      {value !== undefined && (
        <pre>
          {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
        </pre>
      )}
    </div>,
  );

  div.innerHTML = htmlString;

  return div;
}

function getAllOutputVariables(allOutputs) {
  const allOutputVariables = [];

  for (const elementId in allOutputs) {
    if (allOutputs[elementId]) {
      const { variables = {} } = allOutputs[elementId];

      forEach(variables, (variable) => {
        // Ignore variables in legacy format
        // see https://github.com/camunda/task-testing/issues/48 for legacy format
        if (!isObject(variable) || !has(variable, "name")) {
          return;
        }

        const { name, value, scope } = /** @type {Object} */ (variable);

        if (scope !== SCOPES.PROCESS) {
          return;
        }

        allOutputVariables.push({ name, value, origin: elementId });
      });
    }
  }

  return allOutputVariables;
}

/**
 * Get a string representation of the type of a value.
 *
 * @example
 *
 * getDetail('foo') // String
 * getDetail(1337) // Number
 * getDetail(true) // Boolean
 * getDetail({}) // Object
 *
 * @param {any} value
 *
 * @return {string}
 */
function getDetail(value) {
  const type = typeof value;

  if (type === "object") {
    if (Array.isArray(value)) {
      return "Array";
    }

    if (value === null) {
      return "null";
    }

    return "Object";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}
