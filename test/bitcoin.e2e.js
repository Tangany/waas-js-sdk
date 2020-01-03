const { Waas, BITCOIN_NETWORK, BITCOIN_TX_CONFIRMATIONS } = require("../dist");
const { config } = require("dotenv");
const assert = require("assert");
const { resolve } = require("path");
const path = resolve(process.cwd(), ".env");
const debug = require("debug")("waas-js-sdk:bitcoin-e2e");

process.env.DEBUG = "waas-js-sdk:*"; // force enable logging
config({ path });

console.info("this suite only works with a pre-set .env file with api credentials in project's root");
["CLIENT_ID", "CLIENT_SECRET", "SUBSCRIPTION", "VAULT_URL", "E2E_WALLET"].map(v => {
	if (!process.env[v]) {
		throw new Error(`process.env.${v} not defined`);
	}
});

describe("WaaS sample Bitcoin workflow", function () {
	const timeout = 20e3;
	this.timeout(timeout);
	this.slow(timeout / 4);

	const wallet = process.env.E2E_WALLET;
	const recipients = {
		amount: "0.000001",
		to: "2NBDAdTp3gES9Aar5woJBuGZgiyPCP6trmk"
	};

	const options = {
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		subscription: process.env.SUBSCRIPTION,
		vaultUrl: process.env.VAULT_URL,
		bitcoinNetwork: BITCOIN_NETWORK.TESTNET, // All tests execute on testnet3
		bitcoinTxConfirmations: BITCOIN_TX_CONFIRMATIONS.NONE
	};
	const noConfirmationsBtcApi = new Waas(options); // coins available regardless of mining status

	it("should get the Bitcoin specs for the current wallet", async function () {
		const { currency, balance, address } = (await noConfirmationsBtcApi.wallet(wallet).btc().get()).data;
		assert.strictEqual(currency, "BTCTEST");
		assert.ok(balance);
		assert.ok(address);
		debug(`Wallet holds ${balance} ${currency} `);
	});

	it("should estimate the fee for given tx", async function () {
		const { fee, feeRate } = (await noConfirmationsBtcApi.wallet(wallet).btc().estimateFee(recipients)).data;
		assert.ok(fee);
		assert.ok(feeRate);
		debug(`Estimated a total transaction fee of ${fee} for given recipients based on a feeRate of ${feeRate}`);
	});

	let lastHash;
	it("should send some BTC to multiple recipients in a single tx", async function () {
		const { hash } = (await noConfirmationsBtcApi.wallet(wallet).btc().send(
			[recipients, recipients]
		)).data;
		assert.ok(hash);
		debug(`Sent with hash ${hash}`);
		lastHash = hash;
	});

	it("should fetch the tx details", async function () {
		assert.ok(lastHash, "cannot run without previous tests");
		const { confirmations, status } = (await noConfirmationsBtcApi.btc(lastHash).get()).data;
		debug("inital tx status", { confirmations, status });
	});
});
