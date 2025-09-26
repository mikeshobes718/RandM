#!/usr/bin/env node

require('./patchFsTimeouts.js');

const { ESLint } = require('eslint');

(async () => {
  try {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(['.']);
    const formatter = await eslint.loadFormatter();
    const output = formatter.format(results);
    if (output.trim()) {
      console.log(output);
    }
    const hasErrors = results.some((result) => result.errorCount > 0 || result.fatalErrorCount > 0);
    process.exit(hasErrors ? 1 : 0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
