async function mockProviderCreatePayment({ orderId, amount }) {
  return {
    provider: 'mockpay',
    providerTxnId: `MOCK-${Date.now()}`,
    amount,
    checkoutUrl: null,
    orderId
  };
}

module.exports = { mockProviderCreatePayment };
