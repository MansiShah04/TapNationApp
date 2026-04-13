import * as ethers from "../src/config/cryptoSetup";

describe("Crypto Setup", () => {
  it("should export ethers functions", () => {
    expect(ethers.pbkdf2).toBeDefined();
    expect(ethers.hexlify).toBeDefined();
    expect(ethers.toUtf8Bytes).toBeDefined();
  });

  it("should allow creating a random wallet", () => {
    const wallet = ethers.Wallet.createRandom();
    expect(wallet).toBeDefined();
    expect(wallet.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });
});
