# Sepay Payments Hook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tự động ghi nhận thanh toán Sepay cho đơn chuyển khoản bằng mã `DH...`, cập nhật đơn sang `PAID/PROCESSING` khi đúng mã và đúng số tiền.

**Architecture:** Thêm `orderCode` vào `Order`, sinh mã cho đơn `BANK_TRANSFER` trong luồng tạo đơn hiện tại, và thêm route webhook riêng `POST /hooks/sepay-payments`. Logic Sepay được tách thành controller và helper/service nhỏ để parse nội dung, chuẩn hóa số tiền, kiểm tra điều kiện trước khi cập nhật đơn.

**Tech Stack:** Node.js, Express 5, Mongoose 8, axios, serverless-http.

---

## File Structure

- Modify: `src/models/Order.js`
  - Thêm `orderCode` unique/sparse để lưu mã thanh toán dạng `DH[A-Z0-9]{6}`.
- Create: `src/services/orderCodeService.js`
  - Sinh mã `DH` ngẫu nhiên, kiểm tra trùng trong MongoDB, export helper để controller dùng.
- Modify: `src/controllers/orderController.js`
  - Khi tạo đơn `BANK_TRANSFER`, sinh `orderCode` trước khi save.
  - Export helper Telegram hiện có để Sepay controller dùng lại, không nhân đôi logic gửi thông báo.
- Create: `src/services/sepayPaymentService.js`
  - Parse mã `DH[A-Z0-9]{6}` từ nội dung giao dịch.
  - Lấy nội dung và số tiền từ các field phổ biến của body Sepay.
- Create: `src/controllers/sepayController.js`
  - Nhận webhook, tìm đơn theo `orderCode`, kiểm tra điều kiện, cập nhật `paymentStatus`, `orderStatus`, `bankTransferInfo`, gửi Telegram.
- Create: `src/routes/sepayRoutes.js`
  - Định nghĩa `POST /sepay-payments`.
- Modify: `src/routes/index.js`
  - Mount `router.use('/hooks', sepayRoutes)` để endpoint cuối là `/hooks/sepay-payments`.
- Modify: `package.json`
  - Đổi script `test` sang `node --test` để có thể chạy test tự động.
- Create: `src/services/orderCodeService.test.js`
  - Test format mã thanh toán.
- Create: `src/services/sepayPaymentService.test.js`
  - Test parse mã, nội dung, số tiền.

---

### Task 1: Add order code generation service

**Files:**
- Create: `src/services/orderCodeService.js`
- Test: `src/services/orderCodeService.test.js`
- Modify: `package.json`

- [ ] **Step 1: Update test script**

In `package.json`, replace the current scripts block with:

```json
"scripts": {
  "test": "node --test",
  "start": "node app.js"
}
```

- [ ] **Step 2: Write the failing test**

Create `src/services/orderCodeService.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrderCodeCandidate } = require('./orderCodeService');

test('createOrderCodeCandidate returns DH plus 6 uppercase alphanumeric characters', () => {
  const code = createOrderCodeCandidate();

  assert.match(code, /^DH[A-Z0-9]{6}$/);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
npm test -- src/services/orderCodeService.test.js
```

Expected: FAIL with module not found for `./orderCodeService`.

- [ ] **Step 4: Write minimal implementation**

Create `src/services/orderCodeService.js`:

```js
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
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
npm test -- src/services/orderCodeService.test.js
```

Expected: PASS with 1 passing test.

- [ ] **Step 6: Commit**

Only commit files from this task. Do not include existing staged files such as `.env` or `node_modules`.

```bash
git add package.json src/services/orderCodeService.js src/services/orderCodeService.test.js
git commit -m "feat: add order code generator"
```

---

### Task 2: Add orderCode to Order and createOrder

**Files:**
- Modify: `src/models/Order.js`
- Modify: `src/controllers/orderController.js`

- [ ] **Step 1: Add orderCode field to Order schema**

In `src/models/Order.js`, add this field after `shippingAddress` and before `paymentMethod`:

```js
  orderCode: {
    type: String,
    unique: true,
    sparse: true,
    match: /^DH[A-Z0-9]{6}$/
  },
```

The surrounding section should become:

```js
  shippingAddress: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    ward: {
      type: String,
      required: true
    }
  },
  orderCode: {
    type: String,
    unique: true,
    sparse: true,
    match: /^DH[A-Z0-9]{6}$/
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'BANK_TRANSFER'],
    required: true
  },
```

- [ ] **Step 2: Import generator in orderController**

At the top of `src/controllers/orderController.js`, after the `Order` import, add:

```js
const { generateUniqueOrderCode } = require('../services/orderCodeService');
```

The top of the file should become:

```js
// controllers/orderController.js
const axios = require('axios');
const Order = require('../models/Order');
const { generateUniqueOrderCode } = require('../services/orderCodeService');
```

- [ ] **Step 3: Generate orderCode for BANK_TRANSFER orders**

Inside `exports.createOrder`, before `const order = new Order({`, add:

```js
    const orderCode = paymentMethod === 'BANK_TRANSFER'
      ? await generateUniqueOrderCode(Order)
      : undefined;
```

Then add `orderCode,` inside the `new Order` payload after `paymentMethod,`:

```js
    const order = new Order({
      customerInfo,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      orderCode,
      bankTransferInfo: paymentMethod === 'BANK_TRANSFER' ? bankTransferInfo : undefined,
      orderStatus: 'PENDING',
      paymentStatus: undefined,
    });
```

- [ ] **Step 4: Export Telegram helpers for reuse**

At the end of `src/controllers/orderController.js`, after the existing `exports.updateOrderStatus = async (req, res) => { ... };` block, add:

```js
exports.buildOrderMessage = buildOrderMessage;
exports.sendTelegram = sendTelegram;
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- src/services/orderCodeService.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/models/Order.js src/controllers/orderController.js
git commit -m "feat: add payment code to bank transfer orders"
```

---

### Task 3: Add Sepay payload parsing service

**Files:**
- Create: `src/services/sepayPaymentService.js`
- Test: `src/services/sepayPaymentService.test.js`

- [ ] **Step 1: Write failing parser tests**

Create `src/services/sepayPaymentService.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/services/sepayPaymentService.test.js
```

Expected: FAIL with module not found for `./sepayPaymentService`.

- [ ] **Step 3: Implement parser service**

Create `src/services/sepayPaymentService.js`:

```js
function extractOrderCode(content = '') {
  const match = String(content).toUpperCase().match(/DH[A-Z0-9]{6}/);
  return match ? match[0] : null;
}

function firstString(...values) {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim() : '';
}

function extractTransferContent(payload = {}) {
  return firstString(
    payload.content,
    payload.description,
    payload.transaction_content,
    payload.transferContent,
    payload.transfer_content,
    payload.note
  );
}

function normalizeAmount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(normalized) ? normalized : null;
}

function extractTransferAmount(payload = {}) {
  const candidates = [
    payload.transferAmount,
    payload.amount,
    payload.transfer_amount,
    payload.money,
    payload.transactionAmount,
    payload.transaction_amount,
  ];

  for (const candidate of candidates) {
    const amount = normalizeAmount(candidate);

    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

module.exports = {
  extractOrderCode,
  extractTransferContent,
  extractTransferAmount,
};
```

- [ ] **Step 4: Run parser tests to verify they pass**

Run:

```bash
npm test -- src/services/sepayPaymentService.test.js
```

Expected: PASS with 6 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/services/sepayPaymentService.js src/services/sepayPaymentService.test.js
git commit -m "feat: parse sepay payment payloads"
```

---

### Task 4: Add Sepay webhook controller and route

**Files:**
- Create: `src/controllers/sepayController.js`
- Create: `src/routes/sepayRoutes.js`
- Modify: `src/routes/index.js`

- [ ] **Step 1: Create Sepay controller**

Create `src/controllers/sepayController.js`:

```js
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
```

- [ ] **Step 2: Create Sepay route**

Create `src/routes/sepayRoutes.js`:

```js
const express = require('express');
const sepayController = require('../controllers/sepayController');

const router = express.Router();

router.post('/sepay-payments', sepayController.handlePaymentWebhook);

module.exports = router;
```

- [ ] **Step 3: Mount Sepay route**

In `src/routes/index.js`, add this import after `const contentRoutes = require('./ContentRouter');`:

```js
const sepayRoutes = require('./sepayRoutes');
```

Then add this mount before the order routes:

```js
// Webhook routes
router.use('/hooks', sepayRoutes);
```

The relevant section should become:

```js
const contentRoutes = require('./ContentRouter');
const sepayRoutes = require('./sepayRoutes');

// Tất cả API liên quan đến sản phẩm
router.use('/api/v1', productRoutes);
router.use('/api/v1', categoryRoutes);
router.use('/api/v1/upload', uploadRoutes);
router.use('/api/v1', contentRoutes);

// Webhook routes
router.use('/hooks', sepayRoutes);

// Order routes
router.use('/api/orders', orderRoutes);
```

- [ ] **Step 4: Run service tests**

Run:

```bash
npm test -- src/services/orderCodeService.test.js src/services/sepayPaymentService.test.js
```

Expected: PASS with 7 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/controllers/sepayController.js src/routes/sepayRoutes.js src/routes/index.js
git commit -m "feat: add sepay payment webhook"
```

---

### Task 5: Manual verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: PASS with 7 passing tests.

- [ ] **Step 2: Start the server**

Run:

```bash
npm start
```

Expected: console prints `server is running on port: 3001` and MongoDB connects successfully.

- [ ] **Step 3: Create a BANK_TRANSFER order**

Send this request from another terminal:

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerInfo": {
      "fullName": "Khach Test",
      "email": "test@example.com",
      "phone": "0900000000"
    },
    "items": [
      {
        "productInfo": {
          "name": "San pham test",
          "price": 269000,
          "image": "https://example.com/image.jpg",
          "sku": "TEST-SKU"
        },
        "quantity": 1,
        "price": 269000
      }
    ],
    "shippingAddress": {
      "address": "Dia chi test",
      "city": "Ha Noi",
      "district": "Cau Giay",
      "ward": "Dich Vong"
    },
    "paymentMethod": "BANK_TRANSFER"
  }'
```

Expected: response has `success: true`, `data.paymentMethod: "BANK_TRANSFER"`, `data.paymentStatus: "PENDING"`, and `data.orderCode` matching `DH[A-Z0-9]{6}`.

- [ ] **Step 4: Call Sepay hook with the returned orderCode**

Replace `DHXXXXXX` with the actual `orderCode` from Step 3:

```bash
curl -X POST http://localhost:3001/hooks/sepay-payments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Thanh toan don DHXXXXXX",
    "transferAmount": 269000
  }'
```

Expected: response has `success: true`, `data.paymentStatus: "PAID"`, and `data.orderStatus: "PROCESSING"`.

- [ ] **Step 5: Verify duplicate webhook does not update again**

Run the same curl from Step 4 again.

Expected: response has `success: false` and `reason: "Đơn hàng không ở trạng thái chờ thanh toán"`.

- [ ] **Step 6: Verify wrong amount is ignored**

Create another `BANK_TRANSFER` order as in Step 3, then call:

```bash
curl -X POST http://localhost:3001/hooks/sepay-payments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Thanh toan don DHXXXXXX",
    "transferAmount": 1000
  }'
```

Expected: response has `success: false` and `reason: "Số tiền giao dịch không khớp"`.

- [ ] **Step 7: Final status check**

Run:

```bash
git status --short
```

Expected: only intentional files from this implementation are modified, with no `.env` or `node_modules` staged for commit.

---

## Self-Review

- Spec coverage: The plan covers `orderCode`, route `/hooks/sepay-payments`, parsing content/amount, validation by method/status/amount, update to `PAID/PROCESSING`, storing transfer info, Telegram notification, and no-auth behavior.
- Placeholder scan: No TBD/TODO/fill-later placeholders remain; code blocks include concrete content and commands include expected results.
- Type consistency: Services export CommonJS functions; controllers import those exact names; Mongoose field is consistently named `orderCode`; endpoint path is consistently `/hooks/sepay-payments`.
