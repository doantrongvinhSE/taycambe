const Order = require('../models/Order');

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
    const totalAmount = items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const order = new Order({
      customerInfo,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      bankTransferInfo: paymentMethod === 'BANK_TRANSFER' ? bankTransferInfo : undefined
    });

    await order.save();

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

// Lấy tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
  try {
    const { status, paymentMethod, startDate, endDate } = req.query;
    
    // Xây dựng query filter
    const filter = {};
    
    if (status) {
      filter.orderStatus = status;
    }
    
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(filter)
      .populate('items.product')
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

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Trạng thái đơn hàng không hợp lệ'
      });
    }

    // Cập nhật trạng thái
    order.orderStatus = orderStatus;
    await order.save();

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