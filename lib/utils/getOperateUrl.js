import { trimTrailingSlashes } from './trimTrailingSlashes';

/**
 * Get Operate URL for a given process instance.
 *
 * @param {string} operateBaseUrl
 * @param {string} processInstanceKey
 *
 * @returns {string|null}
 */
export function getOperateUrl(operateBaseUrl, processInstanceKey) {
  try {
    const trimmedBaseUrl = trimTrailingSlashes(operateBaseUrl);

    const path = `processes/${processInstanceKey}`;

    const url = new URL(path, `${trimmedBaseUrl}/`);

    return url.toString();
  } catch (err) {
    return null;
  }
}