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

	const tokenWallet = process.env.E2E_WALLET; // Wallet with some Ropsten Ether balance that owns the ERC20 token
	const tokenAddress = process.env.E2E_TOKEN; // mintable & burnable ERC20 token address deployed by the tokenWallet to Ropsten
	const tokenAmount = "0.0032"; // Token amount used for transactions
	const etherAmount = "0.002"; // Ether amount used for transactions
	let tokenWalletAddress; // Token wallet address
	let createdWallet; // Random created wallet name
	let createdWalletAddress; // Created wallet address
	let txHash; // Tx hashes

	// Tangany-based smart contract ("Caller") used for testing here:
	// https://github.com/Tangany/truffle-blueprint/blob/master/contracts/Caller.sol
	const callerContract = "0x6dfC099FD9D1214e37e33Ecb3124dE451b751EbF";

	const api = new Waas({
		ethereumNetwork: EthereumPublicNetwork.ROPSTEN, // All tests execute on the ropsten testnet
	}, undefined, true);

	it("should send a transaction with some data string and read it from the blockchain", async function () {
		const data = "0x" + getRandomHex(300);
		const tx = await api.wallet(tokenWallet).eth().send({ to: "0x0000000000000000000000000000000000000000", amount: "0", data });
		const txDetails = await tx.get();
		console.log({ hash: tx.hash, data: txDetails.data });
		assert.strictEqual(data, txDetails.data);
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

	it("should estimate the transaction fee for a transaction", async function () {
		assert.ok(createdWalletAddress, "cannot run without previous tests");
		const estimation = await api.wallet(tokenWallet).eth().estimateFee({ to: createdWalletAddress, amount: etherAmount });
		console.log(`fee estimation: ${JSON.stringify(estimation, null, 2)}`);
	})

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

	it("should interact with a smart contract using the universal contract endpoint", async function () {
		const request = await api.wallet(tokenWallet).eth().contract(tokenAddress).sendAsync({
			function: "transfer(address,uint256)",
			inputs: [createdWalletAddress, "2500000000000000"]
		});
		console.log(`asynchronous transaction request '${request.id}' started. Waiting for the process to finish...`);
	});

	it("should estimate the transaction fee for a smart contract interaction", async function () {
		const estimation = await api.wallet(tokenWallet).eth().contract(tokenAddress).estimateFee({
			function: "transfer(address,uint256)",
			inputs: [createdWalletAddress, "2500000000000000"]
		});
		console.log(`fee estimation: ${JSON.stringify(estimation, null, 2)}`);
	});

	it("should call a readonly smart contract function", async function(){
		assert.ok(tokenWalletAddress, "cannot run without previous tests");
		const contractResponse = await api.eth().contract(tokenAddress).call({
			function: "balanceOf(address)",
			inputs: [tokenWalletAddress],
			outputs: ["uint256"]
		});
		console.log(`Contract call result: ${JSON.stringify(contractResponse)}`);
	})

	it("should call a readonly smart contract without arguments", async function () {
		const symbol = await api.eth().contract(tokenAddress).call("symbol", ["string"]);
		console.log(`Symbol of contract ${tokenAddress}: ${symbol[0].value}`);
		// Omit the second argument, because the default value ["uint256"] is suitable for totalSupply()
		const supply = await api.eth().contract(tokenAddress).call("totalSupply");
		console.log(`Total supply of ${symbol[0].value}: ${supply[0].value}`);
	});

	it("should call a readonly smart contract function on behalf of a wallet", async function () {
		assert.ok(tokenWalletAddress, "cannot run without previous tests");
		assert.ok(createdWalletAddress, "cannot run without previous tests");

		// balanceOf expects an address as first argument, which is set automatically in this overload
		const balance = await api.wallet(tokenWallet).eth().contract(tokenAddress).call("balanceOf");
		console.log(`balanceOf(${tokenWalletAddress}): ${balance[0].value}`);

		// Since the allowance function expects several parameters, we use the overload with the configuration object
		const allowance = await api.wallet(tokenWallet).eth().contract(tokenAddress).call({
			function: "allowance(address,address)",
			inputs: [tokenWalletAddress, createdWalletAddress],
			outputs: ["uint256"],
		});
		console.log(`Result for allowance(${tokenWalletAddress}, ${createdWalletAddress}): ${JSON.stringify(allowance)}`);
	});

	it("should call a smart contract function with nested array argument", async function () {
		const resultArr = await api.eth().contract(callerContract).call({
			"function": "callFlattenAddressArray(address[][2])",
			"inputs": [
				[
					[
						"0x0120000000000000000000000000000000000000",
						"0x0340000000000000000000000000000000000000"
					],
					[
						"0x1330000000000000000000000000000000000000",
						"0x1440000000000000000000000000000000000000",
						"0x1550000000000000000000000000000000000000"
					]
				]
			],
			outputs: ["address[]"]
		});
		const expected = [
			"0x0120000000000000000000000000000000000000",
			"0x0340000000000000000000000000000000000000",
			"0x1330000000000000000000000000000000000000",
			"0x1440000000000000000000000000000000000000",
			"0x1550000000000000000000000000000000000000"
		];
		assert.deepStrictEqual(resultArr[0].value, expected);
	});

	it("should create a signed transaction that can be manually transmitted", async function () {
		const { rawTransaction } = await api.wallet(tokenWallet).eth().sign({
			to: createdWalletAddress,
			amount: etherAmount
		});
		console.log(`signing endpoint returned '${rawTransaction}'`);
	});

	it("should delete the new wallet", async function () {
		const { recoveryId, scheduledPurgeDate } = await api.wallet(createdWallet).delete();
		assert.ok(recoveryId);
		assert.ok(scheduledPurgeDate);
		console.log(`soft deleted wallet ${recoveryId} and scheduled for purging at ${scheduledPurgeDate}`);
	});
});
