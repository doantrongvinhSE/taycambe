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

test('extractTransferContent reads SePay webhook transaction content', () => {
  const payload = {
    id: 1,
    gateway: 'VPBank',
    transactionDate: '2026-05-29 10:00:00',
    accountNumber: '0343383136',
    code: null,
    content: 'DH8F3K2A',
    transferType: 'in',
    transferAmount: 269000,
  };

  assert.equal(extractTransferContent(payload), 'DH8F3K2A');
});

test('extractTransferContent finds DH code in nested webhook payload', () => {
  const payload = {
    data: {
      transaction: {
        description: 'Khach hang thanh toan DHZZ9999',
      },
    },
  };

  assert.equal(extractTransferContent(payload), 'Khach hang thanh toan DHZZ9999');
});

test('extractTransferContent prefers the field containing DH order code', () => {
  const payload = {
    code: 'SEVN63DC8E5C',
    content: 'SEVN63DC8E5C chuyen tien',
    description: 'NGUYEN VAN A chuyen tien DH8F3K2A',
    transferAmount: 5000000,
  };

  assert.equal(extractTransferContent(payload), 'NGUYEN VAN A chuyen tien DH8F3K2A');
});

test('extractTransferAmount reads and normalizes common amount fields', () => {
  assert.equal(extractTransferAmount({ transferAmount: 269000 }), 269000);
  assert.equal(extractTransferAmount({ amount: '269,000' }), 269000);
  assert.equal(extractTransferAmount({ transfer_amount: '269000' }), 269000);
});

test('extractTransferAmount finds amount in nested webhook payload', () => {
  const payload = {
    data: {
      transaction: {
        transferAmount: '269000',
      },
    },
  };

  assert.equal(extractTransferAmount(payload), 269000);
});

test('extractTransferAmount returns null for missing amount', () => {
  assert.equal(extractTransferAmount({ content: 'DHAAAAAA' }), null);
});
