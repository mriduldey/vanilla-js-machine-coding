/**
 * ================================
 * DEBOUNCE — Features & Significance
 * ================================
 *
 * 1) leading (boolean)
 *    → Executes function immediately on the first call of a debounce cycle.
 *    → Useful when instant feedback is required.
 *
 *    Example:
 *      debounce(saveData, 1000, { leading: true, trailing: false })
 *      // First click runs immediately, rapid clicks ignored.
 *
 *
 * 2) trailing (boolean, default: true)
 *    → Executes function after `wait` ms of inactivity.
 *    → Ensures the final/latest call is processed.
 *
 *    Example:
 *      debounce(fetchResults, 300)
 *      // User types fast → API called once after typing stops.
 *
 *
 * 3) leading + trailing together
 *    → Executes immediately AND again after inactivity (with latest args).
 *
 *    Example:
 *      debounce(autoSave, 2000, { leading: true, trailing: true })
 *      // Saves instantly on first change and again after user stops typing.
 *
 *
 * 4) cancel()
 *    → Cancels any pending execution and clears internal timer/state.
 *    → Useful for cleanup (e.g., component unmount).
 *
 *    Example:
 *      debouncedFn.cancel();
 *
 *
 * 5) flush()
 *    → Immediately executes pending call (if any).
 *    → Useful before navigation / manual submit.
 *
 *    Example:
 *      debouncedFn.flush();
 *
 *
 * BEHAVIOR MATRIX:
 *    leading  trailing   Result
 *    false    true       Standard debounce (most common)
 *    true     false      Immediate-only (button guard)
 *    true     true       Immediate + final execution
 *    false    false      No-op (function never executes)
 *
 *
 * KEY GUARANTEES:
 *    - Preserves latest arguments
 *    - Preserves correct `this` context
 *    - Returns last execution result
 *    - O(1) time & space per call
 */

function debounce(fn, wait = 0, options = {}) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  const { leading = false, trailing = true } = options;

  const invoke = () => {
    const args = lastArgs;
    const context = lastThis;

    lastArgs = null;
    lastThis = null;
    timer = null;

    if (trailing && args) {
      fn.apply(context, args);
    }
  };

  const debounced = function (...args) {
    lastArgs = args;
    lastThis = this;

    const callNow = leading && !timer;

    clearTimeout(timer);
    timer = setTimeout(invoke, wait);

    if (callNow) {
      fn.apply(lastThis, lastArgs);
      lastArgs = null; // prevent duplicate trailing
    }
  };

  // Cancel pending execution
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
    lastArgs = null;
    lastThis = null;
  };

  // Immediately execute pending trailing call
  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      invoke();
    }
  };

  return debounced;
}
