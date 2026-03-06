/**
 * Interview Problem Description (How It Is Usually Asked)

Typical prompt

Implement a throttle function that ensures a function is executed at most once within a specified time interval.

Example

const throttledFn = throttle(fn, 1000);

window.addEventListener("scroll", throttledFn);

Expected behavior:

If the user scrolls 100 times in 1 second, fn should run only once.

After 1 second, it can run again.
 */

function throttle(fn, wait = 0) {
  let lastTime = 0;

  return function (...args) {
    const now = Date.now();

    if (now - lastTime >= wait) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

function demoApiCall(ms) {
  console.log("API called", ms);
}

const throttleApiCall = throttle(demoApiCall, 1000);

// throttleApiCall(1);
// throttleApiCall(2);
// throttleApiCall(3);

setTimeout(() => throttleApiCall(0), 0); //
setTimeout(() => throttleApiCall(50), 50); //
setTimeout(() => throttleApiCall(100), 100); //
setTimeout(() => throttleApiCall(200), 200); //
setTimeout(() => throttleApiCall(600), 600); //
setTimeout(() => throttleApiCall(700), 700); //
