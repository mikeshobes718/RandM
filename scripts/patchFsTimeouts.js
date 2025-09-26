const fs = require('fs');

const origReadFileSync = fs.readFileSync;
const MAX_ATTEMPTS = 5;

function shouldRetry(err) {
  return Boolean(err) && err.code === 'ETIMEDOUT';
}

fs.readFileSync = function patchedReadFileSync(...args) {
  let attempt = 0;
  for (;;) {
    try {
      return origReadFileSync.apply(fs, args);
    } catch (err) {
      if (shouldRetry(err) && attempt < MAX_ATTEMPTS) {
        attempt += 1;
        continue;
      }
      throw err;
    }
  }
};
