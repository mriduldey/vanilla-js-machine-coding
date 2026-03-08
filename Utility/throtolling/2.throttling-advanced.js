/**
 * Creates a throttled version of a function that ensures the function
 * executes at most once within a specified time interval.
 *
 * Throttling is useful when handling events that fire frequently
 * (e.g. scroll, resize, mousemove). It prevents excessive function
 * executions by enforcing a minimum delay between invocations.
 *
 * Behavior:
 * - `leading: true`  → execute immediately on the first call
 * - `trailing: true` → execute once more after the burst of calls ends
 *
 * The throttled function preserves:
 * - the latest arguments passed
 * - the correct `this` context
 *
 * Additional APIs:
 * - `cancel()` → cancels any scheduled trailing execution
 * - `flush()`  → immediately executes the pending trailing call
 *
 * @param {Function} fn
 * Function to be throttled.
 *
 * @param {number} wait
 * Minimum time (in milliseconds) that must pass between executions.
 *
 * @param {Object} [options]
 * Optional configuration object.
 *
 * @param {boolean} [options.leading=true]
 * If true, the function is invoked immediately on the first call.
 *
 * @param {boolean} [options.trailing=true]
 * If true, the function is invoked once more after the last call
 * in a burst of rapid invocations.
 *
 * @returns {Function}
 * Returns a throttled version of the provided function with
 * `cancel()` and `flush()` helper methods.
 */

function throttle(fn, wait, options = {}) {
  let timer = null;
  let lastCallTime = 0;
  let lastArgs, lastThis;

  const { leading = true, trailing = true } = options;

  const invoke = () => {
    lastCallTime = leading === false ? 0 : Date.now();
    timer = null;
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  };

  const throttled = function (...args) {
    const now = Date.now();
    if (!lastCallTime && leading === false) lastCallTime = now;

    const remaining = wait - (now - lastCallTime);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastCallTime = now;
      fn.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
    } else if (!timer && trailing !== false) {
      timer = setTimeout(invoke, remaining);
    }
  };

  // --- FAANG Level Extensions ---

  throttled.cancel = function () {
    clearTimeout(timer);
    timer = null;
    lastCallTime = 0;
    lastArgs = lastThis = null;
  };

  throttled.flush = function () {
    if (timer) {
      invoke();
    }
  };

  return throttled;
}
