import { trimTrailingSlashes } from './trimTrailingSlashes';

/**
 * Get Tasklist URL for a given user task.
 *
 * @param {string} tasklistBaseUrl
 * @param {string} userTaskKey
 *
 * @returns {string|null}
 */
export function getTasklistUrl(tasklistBaseUrl, userTaskKey) {
  try {
    const trimmedBaseUrl = trimTrailingSlashes(tasklistBaseUrl);

    const url = new URL(userTaskKey, `${trimmedBaseUrl}/`);

    return url.toString();
  } catch (err) {
    return null;
  }
}