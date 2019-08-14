const { Waas, ETHEREUM_PUBLIC_NETWORK, BITCOIN_NETWORK, BITCOIN_TX_CONFIRMATIONS,BITCOIN_TX_SPEED, TimeoutError } = require("../dist");
const { config } = require("dotenv");
const { resolve } = require("path");
const debug = require("debug")("waas-js-sdk:wait-e2e");
const assert = require("assert");
const path = resolve(process.cwd(), ".env");

process.env.DEBUG = "waas-js-sdk:*"; // force enable logging
config({ path });

describe("wait", function () {
	
	describe("Ethereum", function () {
		
		const options = {
			clientId: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			subscription: process.env.SUBSCRIPTION,
			vaultUrl: process.env.VAULT_URL,
			ethereumNetwork: ETHEREUM_PUBLIC_NETWORK.ROPSTEN,
		};
		
		it("should wait for a Ethereum tx", async function () {
			this.timeout(60e3);
			
			const api = new Waas(options);
			
			const { wallet: newWallet } = (await api.wallet().create()).data;
			const { address: newWalletAddress } = (await api.wallet(newWallet).eth().get()).data;
			const { hash } = (await api.wallet("func-spec").eth().send({ to: newWalletAddress, amount: "0.000128" })).data;
			
			const response = await api.eth(hash).wait(50e3);
			debug(response.data);
			
			await api.wallet(newWallet).delete();
		});
		
		it("should time out for a Ethereum tx", async function () {
			this.timeout(20e3);
			
			const api = new Waas(options);
			
			const { wallet: newWallet } = (await api.wallet().create()).data;
			const { address: newWalletAddress } = (await api.wallet(newWallet).eth().get()).data;
			const { hash } = (await api.wallet("func-spec").eth().send({ to: newWalletAddress, amount: "0.000128" })).data;
			
			await assert.rejects(async () => api.eth(hash).wait(1e3), TimeoutError);
			
			await api.wallet(newWallet).delete();
		});
	});
	
	describe("Bitcoin", function () {
		const options = {
			clientId: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			subscription: process.env.SUBSCRIPTION,
			vaultUrl: process.env.VAULT_URL,
			bitcoinNetwork: BITCOIN_NETWORK.TESTNET,
			bitcoinTxConfirmations: BITCOIN_TX_CONFIRMATIONS.NONE,
			bitcoinTxSpeed: BITCOIN_TX_SPEED.FAST,
			bitcoinMaxFeeRate: 2000
		};
		
		it("should wait for a Bitcoin tx", async function () {
			this.timeout(600e3); // could take a while
			
			const fastApi = new Waas(options);
			const safeApi = new Waas({ ...options, bitcoinTxConfirmations: BITCOIN_TX_CONFIRMATIONS.DEFAULT });
			
			const { wallet: newWallet } = (await fastApi.wallet().create()).data;
			const { address: newWalletAddress } = (await fastApi.wallet(newWallet).btc().get()).data;
			const { hash } = (await fastApi.wallet("func-spec").btc().send({ to: newWalletAddress, amount: "0.000128" })).data;
			
			const response = await safeApi.btc(hash).wait(600e3);
			debug(response.data);
			
			await fastApi.wallet(newWallet).delete();
		});
		
		it("should time out for a Bitcoin tx", async function () {
			this.timeout(20e3);
			
			const fastApi = new Waas(options);
			const safeApi = new Waas({ ...options, bitcoinTxConfirmations: BITCOIN_TX_CONFIRMATIONS.DEFAULT });
			
			const { wallet: newWallet } = (await fastApi.wallet().create()).data;
			const { address: newWalletAddress } = (await fastApi.wallet(newWallet).btc().get()).data;
			const { hash } = (await fastApi.wallet("func-spec").btc().send({ to: newWalletAddress, amount: "0.000128" })).data;
			
			await assert.rejects(async () => safeApi.btc(hash).wait(1e3), TimeoutError);
			
			await fastApi.wallet(newWallet).delete();
		});
	});
});
