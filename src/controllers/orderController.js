// controllers/orderController.js
const axios = require('axios');
const Order = require('../models/Order');

// ====== Telegram helper ======
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_SEND_URL = TELEGRAM_TOKEN
  ? `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
  : null;

function vnd(n) {
  try {
    return new Intl.NumberFormat('vi-VN').format(n) + ' VND';
  } catch {
    return `${n} VND`;
  }
}

function summarizeItems(items = []) {
  if (!items.length) return '—';
  // Ví dụ: 2x Áo thun (120k), 1x Quần jean (350k)
  return items
    .map(
      (i) =>
        `${i.quantity || 1}x ${i.name || i.sku || 'Sản phẩm'} (${vnd(
          (i.price || 0)
        )})`
    )
    .join(', ');
}

function buildOrderMessage(order, title = '🛒 Đơn hàng mới') {
  const c = order.customerInfo || {};
  const addr = order.shippingAddress || {};
  const bank = order.bankTransferInfo || {};
  const createdAt = new Date(order.createdAt || Date.now()).toLocaleString('vi-VN');

  return [
    `${title}`,
    `• Mã đơn: ${order._id}`,
    `• Khách: ${c.name || c.fullName || '—'}`,
    `• Điện thoại: ${c.phone || '—'}`,
    `• Email: ${c.email || '—'}`,
    `• Sản phẩm: ${summarizeItems(order.items)}`,
    `• Tổng tiền: ${vnd(order.totalAmount || 0)}`,
    `• Thanh toán: ${order.paymentMethod || '—'}` +
      (order.paymentStatus ? ` (${order.paymentStatus})` : ''),
    `• Địa chỉ: ${addr.line1 || ''} ${addr.ward || ''} ${addr.district || ''} ${addr.city || ''}`.replace(/\s+/g,' ').trim() || '—',
    bank.bankName ? `• CK: ${bank.bankName} - ${bank.accountNumber} (${bank.accountName})` : null,
    `• Trạng thái đơn: ${order.orderStatus || 'PENDING'}`,
    `• Thời gian: ${createdAt}`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function sendTelegram(text) {
  // Không chặn luồng nếu thiếu config
  if (!TELEGRAM_SEND_URL || !TELEGRAM_CHAT_ID) {
    console.warn('[TELE] thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID, bỏ qua gửi thông báo');
    return;
  }
  try {
    await axios.post(TELEGRAM_SEND_URL, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      // Không dùng Markdown/HTML để khỏi phải escape ký tự
      disable_web_page_preview: true,
    });
  } catch (err) {
    // Không làm fail API chính nếu Tele lỗi
    console.error('[TELE] Gửi Telegram thất bại:', err?.response?.data || err.message);
  }
}

// ====== Controllers ======

// Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
  try {
    const {
      customerInfo,
      items,
      shippingAddress,
      paymentMethod,
      bankTransferInfo
    } = req.body;

    // Tính tổng tiền
    const totalAmount = (items || []).reduce((total, item) => {
      return total + ((item.price || 0) * (item.quantity || 1));
    }, 0);

    const order = new Order({
      customerInfo,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      bankTransferInfo: paymentMethod === 'BANK_TRANSFER' ? bankTransferInfo : undefined,
      // đảm bảo có trạng thái mặc định
      orderStatus: 'PENDING',
      paymentStatus: undefined,
    });

    await order.save();

    // Gửi Telegram: Đơn hàng mới
    sendTelegram(buildOrderMessage(order, '🛒 Đơn hàng mới'));

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Lấy danh sách đơn hàng theo email
exports.getOrdersByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const orders = await Order.find({ 'customerInfo.email': email })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Lấy danh sách đơn hàng theo số điện thoại
exports.getOrdersByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const orders = await Order.find({ 'customerInfo.phone': phone })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Lấy chi tiết một đơn hàng
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Cập nhật trạng thái thanh toán
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, bankTransferInfo } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng'
      });
    }

    // Chỉ cho phép cập nhật khi thanh toán bằng chuyển khoản
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      return res.status(400).json({
        success: false,
        error: 'Chỉ có thể cập nhật trạng thái thanh toán cho đơn hàng chuyển khoản'
      });
    }

    order.paymentStatus = paymentStatus;
    if (bankTransferInfo) {
      order.bankTransferInfo = bankTransferInfo;
    }

    await order.save();

    // Gửi Telegram: cập nhật thanh toán
    sendTelegram(buildOrderMessage(order, '💳 Cập nhật thanh toán'));

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Lấy tất cả đơn hàng (lọc)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, paymentMethod, startDate, endDate } = req.query;
    
    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(filter).sort('-createdAt');

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng'
      });
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Trạng thái đơn hàng không hợp lệ'
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    // Gửi Telegram: cập nhật trạng thái
    sendTelegram(buildOrderMessage(order, `📦 Trạng thái: ${orderStatus}`));

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
