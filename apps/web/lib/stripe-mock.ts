// Mock Stripe for development when no valid API key is available
export class MockStripe {
  paymentIntents = {
    create: async (params: any) => {
      console.log("🔧 [MOCK] Creating payment intent:", params);
      return {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_mock_secret_${Math.random().toString(36).substring(7)}`,
        amount: params.amount,
        currency: params.currency,
        status: "requires_payment_method",
        metadata: params.metadata,
      };
    },
  };

  webhooks = {
    constructEvent: (body: string, signature: string, secret: string) => {
      return JSON.parse(body);
    },
  };
}

