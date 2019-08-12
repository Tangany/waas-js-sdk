const { WaasApi, BITCOIN_NETWORK, BITCOIN_TX_CONFIRMATIONS } = require("../dist");
const { config } = require("dotenv");
const assert = require("assert");
const { resolve } = require("path");
const path = resolve(process.cwd(), ".env");
config({ path });

describe("WaaS sample Bitcoin workflow", function () {
	const timeout = 20e3;
	this.timeout(timeout);
	this.slow(timeout / 4);
	
	const wallet = "func-spec";
	const recipients = {
		amount: "0.000001",
		to: "2NBDAdTp3gES9Aar5woJBuGZgiyPCP6trmk"
	};
	
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
		bitcoinNetwork: BITCOIN_NETWORK.TESTNET,
		bitcoinTxConfirmations: BITCOIN_TX_CONFIRMATIONS.NONE,
	});
	
	it("should get the Bitcoin specs for the current wallet", async function () {
		const { currency, balance, address } = (await api.wallet(wallet).btc().get()).data;
		assert.strictEqual(currency, "BTCTEST");
		assert.ok(balance);
		assert.ok(address);
		console.log(`Wallet holds ${balance} ${currency} `);
	});
	
	it("should estimate the fee for given tx", async function () {
		const { fee, feeRate } = (await api.wallet(wallet).btc().estimateFee(recipients)).data;
		assert.ok(fee);
		assert.ok(feeRate);
		console.log(`Estimated a total transaction fee of ${fee} for given recipients based on a feeRate of ${feeRate}`);
	});
	
	let lastHash;
	it("should send some BTC to two recipients in a single tx", async function () {
		const { hash } = (await api.wallet(wallet).btc().send(
			[recipients, recipients]
		)).data;
		assert.ok(hash);
		console.log(`Sent with hash ${hash}`);
		lastHash = hash;
	});
	
	it("should fetch the tx details", async function () {
		assert.ok(lastHash, "cannot run without previous tests");
		const { confirmations, status } = (await api.btc(lastHash).get()).data;
		assert.strictEqual(confirmations, 0);
		assert.strictEqual(status, "pending");
		console.log("inital tx status", { confirmations, status });
	});
	
	it("should wait for the transaction to get mined", async function () {
		assert.ok(lastHash, "cannot run without previous tests");
		const { confirmations, status } = (await api.btc(lastHash).wait(timeout)).data;
		assert.ok(confirmations);
		assert.ok(status);
		console.log(`tx mined in block ${confirmations}`);
	});
});
