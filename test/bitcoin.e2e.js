const { Waas, BITCOIN_NETWORK, BITCOIN_TX_CONFIRMATIONS } = require("../dist");
const { config } = require("dotenv");
const assert = require("assert");
const { checkEnvVars } = require("./helpers");
const { resolve } = require("path");
const path = resolve(process.cwd(), ".env");

config({ path });
checkEnvVars();

describe("WaaS sample Bitcoin workflow", function () {
	const timeout = 40e3;
	this.timeout(timeout);
	this.slow(timeout / 4);

	let createdWallet;
	let createdWalletAddress;

	const wallet = process.env.E2E_WALLET;
	// This object should only be used after the wallet creation step because that is where the "to" property is set
	const recipients = {
		amount: "0.00001",
		to: null,
	};

	const options = {
		bitcoinNetwork: BITCOIN_NETWORK.TESTNET, // All tests execute on testnet3
		bitcoinTxConfirmations: BITCOIN_TX_CONFIRMATIONS.NONE
	};
	const noConfirmationsBtcApi = new Waas(options); // coins available regardless of mining status

	it("should fetch the affinity cookie", async function () {
		await noConfirmationsBtcApi.btc().fetchAffinityCookie();
	});

	it("should get the Bitcoin specs for the current wallet", async function () {
		const { currency, balance, address } = await noConfirmationsBtcApi.wallet(wallet).btc().get();
		assert.strictEqual(currency, "BTCTEST");
		assert.ok(balance);
		assert.ok(address);
		console.log(`Wallet holds ${balance} ${currency} `);
	});

	it("should create a new wallet", async function(){
		const { wallet } = await noConfirmationsBtcApi.wallet().create();
		assert.ok(wallet);
		createdWallet = wallet;
		console.log(`Created wallet ${createdWallet}`);
	});

	it("should get the Bitcoin specs for the created wallet", async function () {
		assert.ok(createdWallet, "cannot run without previous tests");
		const {address, balance} = await noConfirmationsBtcApi.wallet(createdWallet).btc().get();
		assert.strictEqual(balance, "0");
		assert.ok(address);
		createdWalletAddress = address;
		recipients.to = address;
	});

	it("should estimate the fee for given tx", async function () {
		const { fee, feeRate } = await noConfirmationsBtcApi.wallet(wallet).btc().estimateFee(recipients);
		assert.ok(fee);
		assert.ok(feeRate);
		console.log(`Estimated a total transaction fee of ${fee} for given recipients based on a feeRate of ${feeRate}`);
	});

	let lastHash;
	it("should send some BTC to multiple recipients in a single tx", async function () {
		const { hash } = await noConfirmationsBtcApi.wallet(wallet).btc().send(
			[recipients, recipients]
		);
		assert.ok(hash);
		console.log(`Sent with hash ${hash}`);
		lastHash = hash;
	});

	it("should fetch the tx details", async function () {
		assert.ok(lastHash, "cannot run without previous tests");
		const details = await noConfirmationsBtcApi.btc(lastHash).get();
		console.log("initial tx status:", JSON.stringify(details, null, 2));
		assert.notStrictEqual(details.status, "unknown");
	});

	it("should await the tx", async function () {
		assert.ok(lastHash, "cannot run without previous tests");
		const { confirmations, status, blockNr } = await noConfirmationsBtcApi.btc(lastHash).wait();
		console.log("inital tx status", { confirmations, status, blockNr });
		assert.notStrictEqual(status, "unknown");
	});

	it("should transfer all funds from the created wallet back to the main wallet", async function () {
		const req = await noConfirmationsBtcApi.wallet(createdWallet).btc().sweepAsync({wallet: wallet});
		await req.wait(35e3);
		const { output } = await req.get();
		console.log(output);
	})

	it("should create a signed transaction that can be manually transmitted", async function () {
		const { rawTransaction } = await noConfirmationsBtcApi.wallet(wallet).btc().sign(recipients);
		console.log(`signing endpoint returned '${rawTransaction}'`);
	});
});
