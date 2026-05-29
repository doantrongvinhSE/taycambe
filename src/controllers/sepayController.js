const Order = require('../models/Order');
const { buildOrderMessage, sendTelegram } = require('./orderController');
const {
  extractOrderCode,
  extractTransferAmount,
  extractTransferContent,
} = require('../services/sepayPaymentService');

function skipped(res, reason) {
  return res.status(200).json({
    success: false,
    reason,
  });
}

exports.handlePaymentWebhook = async (req, res) => {
  try {
    const transferContent = extractTransferContent(req.body);
    const orderCode = extractOrderCode(transferContent);

    if (!orderCode) {
      return skipped(res, 'Không tìm thấy mã thanh toán');
    }

    const transferAmount = extractTransferAmount(req.body);
    if (transferAmount === null) {
      return skipped(res, 'Không tìm thấy số tiền giao dịch');
    }

    const order = await Order.findOne({ orderCode });
    if (!order) {
      return skipped(res, 'Không tìm thấy đơn hàng');
    }

    if (order.paymentMethod !== 'BANK_TRANSFER') {
      return skipped(res, 'Đơn hàng không dùng chuyển khoản');
    }

    if (order.paymentStatus !== 'PENDING') {
      return skipped(res, 'Đơn hàng không ở trạng thái chờ thanh toán');
    }

    if (Number(order.totalAmount) !== Number(transferAmount)) {
      return skipped(res, 'Số tiền giao dịch không khớp');
    }

    order.paymentStatus = 'PAID';
    order.orderStatus = 'PROCESSING';
    order.bankTransferInfo = {
      ...(order.bankTransferInfo?.toObject?.() || order.bankTransferInfo || {}),
      transferAmount,
      transferDate: new Date(),
      transferNote: transferContent,
    };

    await order.save();
    sendTelegram(buildOrderMessage(order, '💳 Sepay xác nhận thanh toán'));

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
