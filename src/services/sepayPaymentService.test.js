const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractOrderCode,
  extractTransferContent,
  extractTransferAmount,
} = require('./sepayPaymentService');

test('extractOrderCode finds DH code inside transfer content', () => {
  assert.equal(extractOrderCode('Thanh toan don DH8F3K2A cam on'), 'DH8F3K2A');
});

test('extractOrderCode normalizes lowercase code', () => {
  assert.equal(extractOrderCode('thanh toan dh8f3k2a'), 'DH8F3K2A');
});

test('extractOrderCode returns null when content has no valid code', () => {
  assert.equal(extractOrderCode('Thanh toan don hang'), null);
});

test('extractTransferContent reads common Sepay content fields', () => {
  assert.equal(extractTransferContent({ content: 'DHAAAAAA' }), 'DHAAAAAA');
  assert.equal(extractTransferContent({ description: 'DHBBBBBB' }), 'DHBBBBBB');
  assert.equal(extractTransferContent({ transaction_content: 'DHCCCCCC' }), 'DHCCCCCC');
});

test('extractTransferAmount reads and normalizes common amount fields', () => {
  assert.equal(extractTransferAmount({ transferAmount: 269000 }), 269000);
  assert.equal(extractTransferAmount({ amount: '269,000' }), 269000);
  assert.equal(extractTransferAmount({ transfer_amount: '269000' }), 269000);
});

test('extractTransferAmount returns null for missing amount', () => {
  assert.equal(extractTransferAmount({ content: 'DHAAAAAA' }), null);
});
