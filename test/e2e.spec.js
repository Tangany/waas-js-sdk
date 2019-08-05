const { WaasApi } = require("../dist");
const { EthereumPublicNetwork, BitcoinNetwork } = require("../src/waas-api");
const { config } = require("dotenv");
const assert = require("assert");
const { resolve } = require("path");

const path = resolve(process.cwd(), ".env");
config({ path });

const tatetoTokenAddress = "0xC32AE45504Ee9482db99CfA21066A59E877Bc0e6";
const testMasterWallet = "func-spec";
const tokenAmountToSend = "0.0032";

describe("WaaS test workflow", function () {
	this.timeout(18000);
	this.slow(6000);
	
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
		ethereumNetwork: EthereumPublicNetwork.ROPSTEN,
		bitcoinNetwork: BitcoinNetwork.TESTNET,
	});
	
	let createdWallet = "";
	let createdWalletAddress = "";
	let tokenTransactionHash = "";
	
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
	
	it("should create a wallet", async function () {
		const { security, created, version, wallet, updated } = (await api.wallet().create()).data;
		assert.ok(security);
		assert.ok(created);
		assert.ok(version);
		assert.ok(wallet);
		assert.ok(updated);
		createdWallet = wallet;
		console.log(`created wallet ${createdWallet}`);
	});
	
	it("should get the created wallet", async function () {
		const { updated, wallet, version, created, security } = (await api.wallet(createdWallet).get()).data;
		assert.ok(security);
		assert.ok(created);
		assert.ok(version);
		assert.ok(wallet);
		assert.ok(updated);
		console.log("wallet", { updated, wallet, version, created, security });
		assert.strictEqual(wallet, createdWallet);
	});
	
	it("should get the Ethereum specs for created wallet", async function () {
		const { address, balance, currency } = (await api.wallet(createdWallet).eth().get()).data;
		assert.ok(address);
		assert.strictEqual(balance, "0");
		assert.ok(currency);
		createdWalletAddress = address;
		console.log(`address for created wallet: ${createdWalletAddress}`);
	});
	
	it("should send a few tokens to the created wallet", async function () {
		const { hash } = (await api.wallet(testMasterWallet).eth().erc20(tatetoTokenAddress).send(createdWalletAddress, tokenAmountToSend)).data;
		assert.ok(hash);
		tokenTransactionHash = hash;
		console.log(`sent ${tokenAmountToSend} token to created walled with hash`, tokenTransactionHash);
	});
	
	it("should wait for the transaction to get mined", async function () {
		const timeout = 100000;
		this.timeout(timeout);
		this.slow(timeout / 2);
		const { isError, blockNr } = (await api.eth(tokenTransactionHash).wait(timeout));
		assert.strictEqual(isError, false);
		assert.ok(blockNr);
		console.log(`mined in blockNr ${blockNr}`);
	});
	
	it("should get the new token balance for the address", async function () {
		const { currency, balance } = (await api.wallet(createdWallet).eth().erc20(tatetoTokenAddress).get()).data;
		assert.strictEqual(currency, "TATETO");
		assert.strictEqual(balance, tokenAmountToSend);
		console.log(`new token balance: ${balance}`);
	});
	
	it("should get the BTC balance for the address", async function () {
		const { currency, balance, address } = (await api.wallet(createdWallet).btc().get()).data;
		assert.strictEqual(currency, "BTCTEST");
		assert.ok(balance);
		assert.ok(address);
		console.log(`Wallet holds ${balance} ${currency} `);
	});
	
	it("should send some BTC to the address", async function () {
		const { hash } = (await api.wallet(testMasterWallet).btc().send({
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
