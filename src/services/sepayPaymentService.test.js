const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractOrderCode,
  extractTransferContent,
  extractTransferAmount,
} = require('./sepayPaymentService');

test('extractOrderCode finds DH plus 8 digits inside transfer content', () => {
  assert.equal(extractOrderCode('NHAN TU 108883537637 TRACE 910954 ND DH12345678'), 'DH12345678');
});

test('extractOrderCode normalizes lowercase code', () => {
  assert.equal(extractOrderCode('thanh toan dh87654321'), 'DH87654321');
});

test('extractOrderCode returns null when content has no valid code', () => {
  assert.equal(extractOrderCode('Thanh toan don DHSIX9WK'), null);
});

test('extractTransferContent reads common Sepay content fields', () => {
  assert.equal(extractTransferContent({ content: 'DH11111111' }), 'DH11111111');
  assert.equal(extractTransferContent({ description: 'DH22222222' }), 'DH22222222');
  assert.equal(extractTransferContent({ transaction_content: 'DH33333333' }), 'DH33333333');
});

test('extractTransferContent reads SePay webhook transaction content', () => {
  const payload = {
    id: 1,
    gateway: 'VPBank',
    transactionDate: '2026-05-29 10:00:00',
    accountNumber: '0343383136',
    code: null,
    content: 'DH12345678',
    transferType: 'in',
    transferAmount: 269000,
  };

  assert.equal(extractTransferContent(payload), 'DH12345678');
});

test('extractTransferContent finds DH code in nested webhook payload', () => {
  const payload = {
    data: {
      transaction: {
        description: 'Khach hang thanh toan DH99999999',
      },
    },
  };

  assert.equal(extractTransferContent(payload), 'Khach hang thanh toan DH99999999');
});

test('extractTransferContent prefers the field containing DH order code', () => {
  const payload = {
    code: 'SEVN63DC8E5C',
    content: 'SEVN63DC8E5C chuyen tien',
    description: 'NGUYEN VAN A chuyen tien DH12345678',
    transferAmount: 5000000,
  };

  assert.equal(extractTransferContent(payload), 'NGUYEN VAN A chuyen tien DH12345678');
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
  assert.equal(extractTransferAmount({ content: 'DH11111111' }), null);
});
