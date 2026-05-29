const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function createOrderCodeCandidate() {
  let suffix = '';

  for (let i = 0; i < 6; i += 1) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }

  return `DH${suffix}`;
}

async function generateUniqueOrderCode(Order) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const orderCode = createOrderCodeCandidate();
    const existingOrder = await Order.exists({ orderCode });

    if (!existingOrder) {
      return orderCode;
    }
  }

  throw new Error('Không thể tạo mã thanh toán duy nhất');
}

module.exports = {
  createOrderCodeCandidate,
  generateUniqueOrderCode,
};
