const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrderCodeCandidate } = require('./orderCodeService');

test('createOrderCodeCandidate returns DH plus 8 digits', () => {
  const code = createOrderCodeCandidate();

  assert.match(code, /^DH\d{8}$/);
});
