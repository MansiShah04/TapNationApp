import * as ethers from "../cryptoSetup";

describe("Custom Ethers Setup", () => {
  it("should export ethers functions", () => {
    expect(ethers.pbkdf2).toBeDefined();
    expect(ethers.hexlify).toBeDefined();
    expect(ethers.toUtf8Bytes).toBeDefined();
  });

  it("should still allow creating a random wallet", () => {
    const wallet = ethers.Wallet.createRandom();
    expect(wallet).toBeDefined();
    expect(wallet.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    console.log("Successfully created a random wallet:", wallet.address);
  });
});
