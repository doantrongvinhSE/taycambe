function extractOrderCode(content = '') {
  const match = String(content).toUpperCase().match(/DH[A-Z0-9]{6}/);
  return match ? match[0] : null;
}

const CONTENT_KEYS = new Set([
  'content',
  'description',
  'transaction_content',
  'transfercontent',
  'transfer_content',
  'note',
]);

const AMOUNT_KEYS = new Set([
  'transferamount',
  'transfer_amount',
  'amount',
  'money',
  'transactionamount',
  'transaction_amount',
]);

function collectValues(payload, matcher, values = []) {
  if (!payload || typeof payload !== 'object') {
    return values;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (matcher(key)) {
      values.push(value);
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      collectValues(value, matcher, values);
    }
  }

  return values;
}

function firstString(values) {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim() : '';
}

function extractTransferContent(payload = {}) {
  const content = firstString(collectValues(
    payload,
    (key) => CONTENT_KEYS.has(key.toLowerCase())
  ));

  if (content) {
    return content;
  }

  return firstString(collectValues(
    payload,
    (key) => typeof key === 'string'
  ).filter((value) => extractOrderCode(value)));
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
  const candidates = collectValues(
    payload,
    (key) => AMOUNT_KEYS.has(key.toLowerCase())
  );

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
