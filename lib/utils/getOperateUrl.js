/**
 * @param {string} operateBaseUrl
 * @param {string} processInstanceKey
 * @returns {string}
 */
export function getOperateUrl(operateBaseUrl, processInstanceKey) {

  const normalizedBase = operateBaseUrl.replace(/\/+$/, '');
  const path = `processes/${processInstanceKey}`;

  const url = new URL(path, `${normalizedBase}/`);
  return url.toString();
}