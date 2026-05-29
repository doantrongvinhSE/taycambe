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
