const { WaasApi } = require("../dist");
const { EthereumPublicNetwork } = require("../src/waas-api");
const { config } = require("dotenv");
const assert = require("assert");
const { resolve } = require("path");

const path = resolve(process.cwd(), ".env");
config({ path });

const tokenAddress = "0xC32AE45504Ee9482db99CfA21066A59E877Bc0e6"; // ERC20 token address
const tokenName = "TATETO"; // ERC20 token name
const tokenMasterWallet = "func-spec"; // Wallet that owns the ERC20 token
let tokenMasterWalletAddress; // Wallet address
const tokenAmountToSend = "0.0032"; // Token amount used for transactions
const etherToSend = "0.001"; // Token amount used for transactions

describe("WaaS sample Ethereum workflow", function () {
	const timeout = 36e3;  // Must suffice for the Ethereum testnet mining delay
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
	
	let createdWallet = "";
	let createdWalletAddress = "";
	let tokenTransactionHash = "";
	
	const api = new WaasApi({
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		subscription: process.env.SUBSCRIPTION,
		vaultUrl: process.env.VAULT_URL,
		ethereumNetwork: EthereumPublicNetwork.ROPSTEN,
	});
	
	it("should list available wallets", async function () {
		const allWallets = (await api.wallet().list()).data;
		assert.ok(allWallets.list.length);
		console.log("wallets list", allWallets);
		
		if (allWallets.skiptoken) {
			console.log(`fetching next list page for skiptoken`);
			const nextList = (await api.wallet().list(allWallets.skiptoken)).data;
			assert.ok(nextList.list.length);
			assert.strictEqual(allWallets.list.find(l => l.wallet === nextList.list[0].wallet), undefined);
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
		console.log(`created wallet ${createdWallet}`);
	});
	
	it("should get the created wallet data", async function () {
		assert.ok(createdWallet, "cannot run without previous tests");
		const { updated, wallet, version, created, security } = (await api.wallet(createdWallet).get()).data;
		assert.ok(security);
		assert.ok(created);
		assert.ok(version);
		assert.ok(wallet);
		assert.ok(updated);
		console.log("wallet", { updated, wallet, version, created, security });
		assert.strictEqual(wallet, createdWallet);
	});
	
	it("should send a small amount of ether to the new wallet to fund the token transactions", async function () {
		const { hash } = (await api.wallet(tokenMasterWallet).eth().send(createdWalletAddress, etherToSend)).data;
		await api.eth(hash).wait(timeout);
	});
	
	it("should get the Ethereum specs for created wallet", async function () {
		assert.ok(createdWallet, "cannot run without previous tests");
		const { address, balance, currency } = (await api.wallet(createdWallet).eth().get()).data;
		assert.ok(address);
		assert.strictEqual(balance, etherToSend);
		assert.ok(currency);
		createdWalletAddress = address;
		console.log(`Address for created wallet: ${createdWalletAddress}. Balance: ${balance}`);
	});
	
	it("should send a few tokens to the created wallet", async function () {
		assert.ok(createdWalletAddress, "cannot run without previous tests");
		const { hash } = (await api.wallet(tokenMasterWallet).eth().erc20(tokenAddress).send(createdWalletAddress, tokenAmountToSend)).data;
		assert.ok(hash);
		tokenTransactionHash = hash;
		console.log(`sent ${tokenAmountToSend} token to created walled with hash`, tokenTransactionHash);
	});
	
	it("should get the transaction status for the hash", async function () {
		assert.ok(tokenTransactionHash, "cannot run without previous tests");
		const { blockNr, isError } = (await api.eth(tokenTransactionHash).get()).data;
		console.log("inital tx status", { blockNr, isError });
		assert.strictEqual(isError, false);
	});
	
	it("should wait for the transaction to get mined", async function () {
		assert.ok(tokenTransactionHash, "cannot run without previous tests");
		const { isError, blockNr } = (await api.eth(tokenTransactionHash).wait(timeout));
		assert.ok(typeof blockNr === "number");
		console.log(`mined in blockNr ${blockNr}`);
	});
	
	it("should get the new token balance for the new wallet", async function () {
		const { currency, balance } = (await api.wallet(createdWallet).eth().erc20(tokenAddress).get()).data;
		assert.strictEqual(currency, tokenName);
		assert.strictEqual(balance, tokenAmountToSend);
		console.log(`new token balance: ${balance}`);
	});
	
	it("should approve to the master wallet to withdraw tokens from the new wallet", async function () {
		tokenMasterWalletAddress = (await api.wallet(tokenMasterWallet).eth().get()).data.address;
		console.log("tokenMasterWalletAddress", tokenMasterWalletAddress);
		const { hash } = (await api.wallet(createdWallet).eth().erc20(tokenAddress).approve(tokenMasterWalletAddress, tokenAmountToSend)).data;
		await api.eth(hash).wait(timeout);
	});
	
	it("should withdraw the approved token amount from the new wallet", async function () {
		const { hash } = (await api.wallet(tokenMasterWallet).eth().erc20(tokenAddress).transferFrom(createdWalletAddress, tokenAmountToSend)).data;
		await api.eth(hash).wait(timeout);
		const { balance } = (await api.wallet(createdWallet).eth().erc20(tokenAddress).get()).data;
		assert.strictEqual(balance, "0");
		console.log(`new token balance: ${balance}`);
	});
});
