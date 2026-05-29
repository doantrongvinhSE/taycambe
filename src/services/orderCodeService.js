function createOrderCodeCandidate() {
  return `DH${Math.floor(10000000 + Math.random() * 90000000)}`;
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
