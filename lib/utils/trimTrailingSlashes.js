/**
 * Trim trailing slashes from a string.
 *
 * @example
 * trimTrailingSlashes('http://example.com/') // => 'http://example.com'
 * trimTrailingSlashes('http://example.com///') // => 'http://example.com'
 *
 * @param {string} string
 *
 * @returns {string}
 */
export function trimTrailingSlashes(string) {
  let end = string.length;

  while (end > 0 && string[end - 1] === '/') {
    end--;
  }

  return string.slice(0, end);
}
