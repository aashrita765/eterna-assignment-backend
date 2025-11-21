function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export class MockDexRouter {

  async getRaydiumQuote() {
    await sleep(200);
    const price = 1 * (0.98 + Math.random() * 0.04);
    return { dex: "Raydium", price, fee: 0.003, effective: price * 1.003 };
  }

  async getMeteoraQuote() {
    await sleep(200);
    const price = 1 * (0.97 + Math.random() * 0.05);
    return { dex: "Meteora", price, fee: 0.002, effective: price * 1.002 };
  }

  async executeSwap(quote: any) {
    await sleep(2000 + Math.random() * 1000);

    return {
      txHash: Math.random().toString(36).substring(2),
      executedPrice: quote.price * (1 + (Math.random() - 0.5) * 0.01),
      dex: quote.dex
    };
  }
}
