const { Waas } = require("../dist");
const { EthereumPublicNetwork } = require("../src/waas");
const { config } = require("dotenv");
const assert = require("assert");
const { checkEnvVars } = require("./helpers");
const { getRandomHex } = require("./helpers");
const { resolve } = require("path");
const path = resolve(process.cwd(), ".env");

config({ path });
checkEnvVars();

describe("WaaS sample Ethereum workflow", function () {
	const timeout = 160e3;
	this.timeout(timeout);
	this.slow(timeout / 3);

	const tokenAddress = process.env.E2E_TOKEN; // mintable ERC20 token address
	const tokenWallet = process.env.E2E_WALLET; // Wallet with some testnet balance that owns the mintable ERC20 token
	const tokenAmount = "0.0032"; // Token amount used for transactions
	const etherAmount = "0.001"; // Token amount used for transactions
	let tokenWalletAddress; // Token wallet address
	let createdWallet; // Random created wallet name
	let createdWalletAddress; // Created wallet address
	let txHash; // Tx hashes

	const api = new Waas({
		ethereumNetwork: EthereumPublicNetwork.ROPSTEN, // All tests execute on the ropsten testnet
	}, undefined, true);

	it("should send a transaction with some data string and read it from the blockchain", async function () {
		const data = "0x" + getRandomHex(300);
		const { hash } = await api.wallet(tokenWallet).eth().send({ to: "0x0000000000000000000000000000000000000000", amount: "0", data });
		const tx = await api.eth(hash).get();
		console.log({ hash, data: tx.data });
		assert.strictEqual(data, tx.data);
	});

	it("should create a new wallet", async function () {
		const { security, created, version, wallet, updated } = await api.wallet().create();
		assert.ok(security);
		assert.ok(created);
		assert.ok(version);
		assert.ok(wallet);
		assert.ok(updated);
		createdWallet = wallet;
		console.log(`created wallet ${createdWallet}`);
	});

	it("should get the created wallet data", async function () {
		assert.ok(createdWallet, "cannot run without previous tests");
		const { security, created, version, wallet, updated } = await api.wallet(createdWallet).get();
		assert.ok(security);
		assert.ok(created);
		assert.ok(version);
		assert.ok(wallet);
		assert.ok(updated);
		console.log("wallet", { updated, wallet, version, created, security });
		assert.strictEqual(wallet, createdWallet);
	});

	it("should get the Ethereum specs for created wallet", async function () {
		assert.ok(createdWallet, "cannot run without previous tests");
		const { address, balance, currency } = await api.wallet(createdWallet).eth().get();
		assert.ok(address);
		assert.strictEqual(balance, "0");
		assert.strictEqual(currency, "ETHER");
		createdWalletAddress = address;
		console.log(`address for created wallet: ${createdWalletAddress}. Balance: ${balance}`);
	});

	it("should send a few tokens to the created wallet", async function () {
		assert.ok(createdWalletAddress, "cannot run without previous tests");
		const { hash } = await api.wallet(tokenWallet).eth().erc20(tokenAddress).send({ to: createdWalletAddress, amount: tokenAmount });
		assert.ok(hash);
		txHash = hash;
		console.log(`sent ${tokenAmount} token to created walled with hash`, hash);
	});

	it("should get the transaction status for the hash", async function () {
		assert.ok(txHash, "cannot run without previous tests");
		const { blockNr, isError, data, confirmations, status } = await api.eth(txHash).get();
		console.log("inital tx status", { blockNr, isError, data, confirmations, status });
		assert.strictEqual(isError, false);
		assert.notStrictEqual(status, "unknown");
	});

	it("should wait for the transaction to get mined", async function () {
		assert.ok(txHash, "cannot run without previous tests");
		const { isError, blockNr } = await api.eth(txHash).wait(timeout);
		assert.ok(typeof blockNr === "number");
		console.log(`mined in blockNr ${blockNr}`);
	});

	it("should get the new token balance for the new wallet", async function () {
		const { currency, balance } = await api.wallet(createdWallet).eth().erc20(tokenAddress).get();
		assert.ok(currency);
		assert.strictEqual(balance, tokenAmount);
		console.log(`new token balance: ${balance}`);
	});

	it("should send a small amount of ether to the new wallet to fund the token transactions", async function () {
		assert.ok(createdWalletAddress, "cannot run without previous tests");
		const { hash } = await api.wallet(tokenWallet).eth().send({ to: createdWalletAddress, amount: etherAmount });
		console.log(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
	});

	it("should approve to the master wallet to withdraw tokens from the new wallet", async function () {
		tokenWalletAddress = (await api.wallet(tokenWallet).eth().get()).address;
		console.log("tokenMasterWalletAddress", tokenWalletAddress);
		const { hash } = await api.wallet(createdWallet).eth().erc20(tokenAddress).approve({ to: tokenWalletAddress, amount: tokenAmount });
		console.log(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
	});

	it("should withdraw the approved token amount from the new wallet", async function () {
		const { hash } = await api.wallet(tokenWallet).eth().erc20(tokenAddress).transferFrom({ from: createdWalletAddress, amount: tokenAmount });
		console.log(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
		const { balance } = await api.wallet(createdWallet).eth().erc20(tokenAddress).get();
		assert.strictEqual(balance, "0");
		console.log(`new token balance: ${balance}`);
	});

	it("should mint tokens to new wallet", async function () {
		const { hash } = await api.wallet(tokenWallet).eth().erc20(tokenAddress).mint({ amount: tokenAmount, to: createdWalletAddress });
		console.log(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
		const { balance } = await api.wallet(createdWallet).eth().erc20(tokenAddress).get();
		assert.strictEqual(balance, tokenAmount);
		console.log(`new token balance: ${balance}`);
	});

	it("should burn tokens from new wallet", async function () {
		const { hash } = await api.wallet(createdWallet).eth().erc20(tokenAddress).burn({ amount: tokenAmount });
		console.log(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
		const { balance } = await api.wallet(createdWallet).eth().erc20(tokenAddress).get();
		assert.strictEqual(balance, "0");
		console.log(`new token balance: ${balance}`);
	});

	it("should interact with a smart contract using the data interface", async function () {
		const { hash } = await api.wallet(tokenWallet).eth().send({
			to: tokenAddress,
			amount: "0",
			data: "0x40c10f1900000000000000000000000076f0ce0ee55bf1aae0adf85a2cd348b8dd3583760000000000000000000000000000000000000000000000000de0b6b3a7640000" // mint 1 token to 0x76f0ce0ee55bf1aae0adf85a2cd348b8dd358376
		});
		console.log(`transaction made with txhash ${hash}. Waiting for the transaction to get mined...`);
		await api.eth(hash).wait(timeout);
	});

	it("should delete the new wallet", async function () {
		const { recoveryId, scheduledPurgeDate } = await api.wallet(createdWallet).delete();
		assert.ok(recoveryId);
		assert.ok(scheduledPurgeDate);
		console.log(`soft deleted wallet ${recoveryId} and scheduled for purging at ${scheduledPurgeDate}`);
	});
});
