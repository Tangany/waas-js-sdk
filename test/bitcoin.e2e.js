const { WaasApi } = require("../dist");
const tokenMasterWallet = "func-spec"; // Wallet that owns the ERC20 token

describe("WaaS sample Bitcoin workflow", function () {
	const timeout = 36e3;
	this.timeout(timeout);
	this.slow(timeout / 3);
	
	console.info("this suite only works with a pre-set .env file with api credentials in project's root");
	
	if (!process.env.CLIENT_ID) {
		throw new Error("process.env.CLIENT_ID not defined");
	}
	if (!process.env.CLIENT_SECRET) {
		throw new Error("process.env.CLIENT_SECRET not defined");
	}
	if (!process.env.SUBSCRIPTION) {
		throw new Error("process.env.SUBSCRIPTION not defined");
	}
	if (!process.env.VAULT_URL) {
		throw new Error("process.env.VAULT_URL not defined");
	}
	
	const api = new WaasApi({
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		subscription: process.env.SUBSCRIPTION,
		vaultUrl: process.env.VAULT_URL,
		bitcoinNetwork: BitcoinNetwork.TESTNET,
	});
	
	it("should get the Bitcoin specs for the current wallet", async function () {
		const { currency, balance, address } = (await api.wallet(createdWallet).btc().get()).data;
		assert.strictEqual(currency, "BTCTEST");
		assert.ok(balance);
		assert.ok(address);
		console.log(`Wallet holds ${balance} ${currency} `);
	});
	
	it("should send some BTC to the address", async function () {
		const { hash } = (await api.wallet(tokenMasterWallet).btc().send({
			amount: "0.000001",
			to: "2NBDAdTp3gES9Aar5woJBuGZgiyPCP6trmk"
		})).data;
		assert.ok(hash);
		console.log(`Sent with hash ${hash}`);
	});
	
	it("should delete the created wallet", async function () {
		const { recoveryId, scheduledPurgeDate } = (await api.wallet(createdWallet).delete()).data;
		assert.strictEqual(recoveryId, createdWallet);
		assert.ok(scheduledPurgeDate);
		console.log(`deleted wallet ${createdWallet} with scheduled purge date at ${scheduledPurgeDate}`);
	});
});
