const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrderCodeCandidate } = require('./orderCodeService');

test('createOrderCodeCandidate returns DH plus 6 uppercase alphanumeric characters', () => {
  const code = createOrderCodeCandidate();

  assert.match(code, /^DH[A-Z0-9]{6}$/);
});
