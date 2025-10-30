/**
 * Check if an object has the shape of a Variable type.
 * @param {any} obj
 * @returns {boolean}
 */
export function isVariable(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'name' in obj &&
    'scope' in obj &&
    'type' in obj
  );
}

/**
 * Parse string value to its actual type.
 * @param {string} value
 * @returns {any}
 */
export function parseValueFromString(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Get one of the known types from any value.
 *
 * @param {any} value
 * @returns {import('../types').VARIABLE_TYPE}
 */
export function getTypeFromValue(value) {
  const type = typeof value;

  if (type === 'object') {
    if (Array.isArray(value)) {
      return 'Array';
    }

    if (value === null) {
      return 'Object';
    }

    return 'Object';
  }

  if (type === 'number') {
    return 'Number';
  }

  if (type === 'boolean') {
    return 'Boolean';
  }

  if (type === 'string') {
    return 'String';
  }

  return 'Unknown';
}