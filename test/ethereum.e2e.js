const { Waas } = require("../dist");
const { EthereumPublicNetwork } = require("../src/waas");
const { config } = require("dotenv");
const assert = require("assert");
const { getRandomHex } = require("./helpers");
const { resolve } = require("path");
const debug = require("debug")("waas-js-sdk:ethereum-e2e");
const path = resolve(process.cwd(), ".env");

process.env.DEBUG = "waas-js-sdk:*"; // force enable logging
config({ path });

console.info("this suite only works with a pre-set .env file with api credentials in project's root");
["CLIENT_ID", "CLIENT_SECRET", "SUBSCRIPTION", "VAULT_URL", "E2E_WALLET", "E2E_TOKEN"].map(v => {
	if (!process.env[v]) {
		throw new Error(`process.env.${v} not defined`);
	}
});

describe("WaaS sample Ethereum workflow", function () {
	const timeout = 120e3;  // Ethereum testnet mining delay
	this.timeout(timeout);
	this.slow(timeout / 3);

	const tokenAddress = process.env.E2E_TOKEN; // ERC20 token address
	const tokenWallet = process.env.E2E_WALLET; // Wallet with some testnet balance that owns the ERC20 token
	const tokenAmount = "0.0032"; // Token amount used for transactions
	const etherAmount = "0.001"; // Token amount used for transactions
	let tokenWalletAddress; // Token wallet address
	let createdWallet; // Random created wallet name
	let createdWalletAddress; // Created wallet address
	let txHash; // Tx hashes

	const api = new Waas({
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		subscription: process.env.SUBSCRIPTION,
		vaultUrl: process.env.VAULT_URL,
		ethereumNetwork: EthereumPublicNetwork.ROPSTEN, // All tests execute on the ropsten testnet
	}, undefined, true);

	it("should send a transaction with some data string and read it from the blockchain", async function () {
		const data = getRandomHex(300);
		const { data: { hash } } = await api.wallet(tokenWallet).eth().send({ to: "0x0000000000000000000000000000000000000000", amount: "0", data });
		console.log({ hash, data });
		const tx = await api.eth(hash).get();
		assert.strictEqual(data, tx.data.data);
	});

	it("should list available wallets", async function () {
		const allWallets = (await api.wallet().list()).data;
		assert.ok(allWallets.list.length);
		debug("wallets list", allWallets);

		if (allWallets.skiptoken) {
			debug(`fetching next list page for skiptoken`);
			const nextList = (await api.wallet().list(allWallets.skiptoken)).data;
			assert.ok(nextList.list.length);
			assert.strictEqual(allWallets.list.find(l => l.wallet === nextList.list[0].wallet), undefined);
			debug("wallet list next page", nextList);
		}
	});

	it("should create a new wallet", async function () {
		const { security, created, version, wallet, updated } = (await api.wallet().create()).data;
		assert.ok(security);
		assert.ok(created);
		assert.ok(version);
		assert.ok(wallet);
		assert.ok(updated);
		createdWallet = wallet;
		debug(`created wallet ${createdWallet}`);
	});

	it("should get the created wallet data", async function () {
		assert.ok(createdWallet, "cannot run without previous tests");
		const { security, created, version, wallet, updated } = (await api.wallet(createdWallet).get()).data;
		assert.ok(security);
		assert.ok(created);
		assert.ok(version);
		assert.ok(wallet);
		assert.ok(updated);
		debug("wallet", { updated, wallet, version, created, security });
		assert.strictEqual(wallet, createdWallet);
	});

	it("should get the Ethereum specs for created wallet", async function () {
		assert.ok(createdWallet, "cannot run without previous tests");
		const { address, balance, currency } = (await api.wallet(createdWallet).eth().get()).data;
		assert.ok(address);
		assert.strictEqual(balance, "0");
		assert.strictEqual(currency, "ETHER");
		createdWalletAddress = address;
		debug(`address for created wallet: ${createdWalletAddress}. Balance: ${balance}`);
	});

	it("should send a few tokens to the created wallet", async function () {
		assert.ok(createdWalletAddress, "cannot run without previous tests");
		const { hash } = (await api.wallet(tokenWallet).eth().erc20(tokenAddress).send(createdWalletAddress, tokenAmount)).data;
		assert.ok(hash);
		txHash = hash;
		debug(`sent ${tokenAmount} token to created walled with hash`, hash);
	});

	it("should get the transaction status for the hash", async function () {
		assert.ok(txHash, "cannot run without previous tests");
		const { blockNr, isError } = (await api.eth(txHash).get()).data;
		debug("inital tx status", { blockNr, isError });
		assert.strictEqual(isError, false);
	});

	it("should wait for the transaction to get mined", async function () {
		assert.ok(txHash, "cannot run without previous tests");
		const { isError, blockNr } = (await api.eth(txHash).wait(timeout)).data;
		assert.ok(typeof blockNr === "number");
		debug(`mined in blockNr ${blockNr}`);
	});

	it("should get the new token balance for the new wallet", async function () {
		const { currency, balance } = (await api.wallet(createdWallet).eth().erc20(tokenAddress).get()).data;
		assert.ok(currency);
		assert.strictEqual(balance, tokenAmount);
		debug(`new token balance: ${balance}`);
	});

	it("should send a small amount of ether to the new wallet to fund the token transactions", async function () {
		assert.ok(createdWalletAddress, "cannot run without previous tests");
		const { hash } = (await api.wallet(tokenWallet).eth().send({ to: createdWalletAddress, amount: etherAmount })).data;
		debug(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
	});

	it("should approve to the master wallet to withdraw tokens from the new wallet", async function () {
		tokenWalletAddress = (await api.wallet(tokenWallet).eth().get()).data.address;
		debug("tokenMasterWalletAddress", tokenWalletAddress);
		const { hash } = (await api.wallet(createdWallet).eth().erc20(tokenAddress).approve(tokenWalletAddress, tokenAmount)).data;
		debug(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
	});

	it("should withdraw the approved token amount from the new wallet", async function () {
		const { hash } = (await api.wallet(tokenWallet).eth().erc20(tokenAddress).transferFrom(createdWalletAddress, tokenAmount)).data;
		debug(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
		const { balance } = (await api.wallet(createdWallet).eth().erc20(tokenAddress).get()).data;
		assert.strictEqual(balance, "0");
		debug(`new token balance: ${balance}`);
	});

	it("should mint tokens to new wallet", async function () {
		const { hash } = (await api.wallet(tokenWallet).eth().erc20(tokenAddress).mint(tokenAmount, createdWalletAddress)).data;
		debug(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
		const { balance } = (await api.wallet(createdWallet).eth().erc20(tokenAddress).get()).data;
		assert.strictEqual(balance, tokenAmount);
		debug(`new token balance: ${balance}`);
	});

	it("should burn tokens from new wallet", async function () {
		const { hash } = (await api.wallet(createdWallet).eth().erc20(tokenAddress).burn(tokenAmount)).data;
		debug(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
		const { balance } = (await api.wallet(createdWallet).eth().erc20(tokenAddress).get()).data;
		assert.strictEqual(balance, "0");
		debug(`new token balance: ${balance}`);
	});

	it("should delete the new wallet", async function () {
		const { recoveryId, scheduledPurgeDate } = (await api.wallet(createdWallet).delete()).data;
		assert.ok(recoveryId);
		assert.ok(scheduledPurgeDate);
		debug(`soft deleted wallet ${recoveryId} and scheduled for purging at ${scheduledPurgeDate}`);
	});
});
