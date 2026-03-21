// Basic level Implementation

function debounce(fn, wait) {
    let timer = null;

    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, wait);
    }
}


function demoApiCall(ms) {
    console.log('API called', ms);
}

const debounceApiCall = debounce(demoApiCall, 500);

setTimeout(() => debounceApiCall(0), 0); // scheduled for after 500 ms of program star
setTimeout(() => debounceApiCall(50), 50); // previous cleared |-> scheduled for after 50 + 500 = 550 ms from program start
setTimeout(() => debounceApiCall(100), 100); // previous cleared |-> after 100 + 500 = 600 ms from program start
setTimeout(() => debounceApiCall(200), 200); // ... |-> after 700 ms
setTimeout(() => debounceApiCall(600), 600); // ... |-> after 1100 ms 
setTimeout(() => debounceApiCall(700), 700); // ... |-> after 1200 ms

// privious is not cleared by this as 1200 < 1300. So previous call will happen. Also this call as no one is clearing it because it is the last call
setTimeout(() => debounceApiCall(1300), 1300);  


/**
 * output
 * API called 700
 * API called 1300
 */