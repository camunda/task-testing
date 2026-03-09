/**
 * Creates a deferred promise that can be resolved/rejected manually.
 *
 * @template T
 * @returns {{ promise: Promise<T>, resolve: (value: T) => void, reject: (reason: any) => void }}
 */
export function createDeferred() {
  let resolve, reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
