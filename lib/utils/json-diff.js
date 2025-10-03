/**
 * Compares two JSON-like objects and returns the differences
 * @param {any} objA - First object to compare
 * @param {any} objB - Second object to compare
 * @returns {Object} Object containing { new: [], modified: [] } arrays of property keys
 */
export function jsonDiff(objA, objB) {
  const result = {
    added: /** @type {string[]} */ ([]),
    modified: /** @type {string[]} */ ([])
  };

  // Helper function to check if a value is a plain object
  function isPlainObject(value) {
    return value !== null &&
           typeof value === 'object' &&
           value.constructor === Object;
  }

  // Helper function to check if two values are equal
  function isEqual(a, b) {
    if (a === b) return true;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => isEqual(item, b[index]));
    }

    if (isPlainObject(a) && isPlainObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(key =>
        keysB.includes(key) && isEqual(a[key], b[key])
      );
    }

    return false;
  }

  // Get keys from objB (we only care about properties that exist in objB)
  const keysB = Object.keys(objB || {});

  for (const key of keysB) {
    const valueA = objA?.[key];
    const valueB = objB[key];
    const existsInA = objA && Object.prototype.hasOwnProperty.call(objA, key);

    // Skip if property exists in both objects and values are identical
    if (existsInA && isEqual(valueA, valueB)) {
      continue;
    }

    // Include if: property doesn't exist in objA, OR exists in both but values differ
    if (!existsInA || !isEqual(valueA, valueB)) {

      // If both values are plain objects, recursively compare
      if (existsInA && isPlainObject(valueA) && isPlainObject(valueB)) {
        const nestedDiff = jsonDiff(valueA, valueB);

        // Only include nested diff if there are actual differences
        if (nestedDiff.new.length > 0 || nestedDiff.modified.length > 0) {
          result.modified.push(key);
        }
      } else {

        // Property is new in objB or values are different, record the key
        if (!existsInA) {
          result.added.push(key);
        } else {
          result.modified.push(key);
        }
      }
    }
  }

  return result;
}