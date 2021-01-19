const { Waas, ETHEREUM_PUBLIC_NETWORK, BITCOIN_NETWORK, BITCOIN_TX_CONFIRMATIONS, BITCOIN_TX_SPEED, TimeoutError } = require("../dist");
const { config } = require("dotenv");
const { resolve } = require("path");
const assert = require("assert");
const { checkEnvVars } = require("./helpers");
const path = resolve(process.cwd(), ".env");

config({ path });
checkEnvVars();

describe("wait", function () {

	const wallet = process.env.E2E_WALLET;

	describe("Ethereum", function () {
		const options = {
			ethereumNetwork: ETHEREUM_PUBLIC_NETWORK.ROPSTEN, // All tests execute on the ropsten testnet
		};

		it("should wait for a synchronous Ethereum tx", async function () {
			this.timeout(180e3);

			const api = new Waas(options);

			const { wallet: newWallet } = await api.wallet().create();
			const { address: newWalletAddress } = await api.wallet(newWallet).eth().get();
			const { hash } = await api.wallet(wallet).eth().send({ to: newWalletAddress, amount: "0.000128" });

			const response = await api.eth(hash).wait(120e3);
			console.log(response);

			await api.wallet(newWallet).delete();
		});

		it("should time out for a synchronous Ethereum tx", async function () {
			this.timeout(60e3);

			const api = new Waas(options);

			const { wallet: newWallet } = await api.wallet().create();
			const { address: newWalletAddress } = await api.wallet(newWallet).eth().get();
			const { hash } = await api.wallet(wallet).eth().send({ to: newWalletAddress, amount: "0.000128" });

			await assert.rejects(async () => api.eth(hash).wait(1e3), TimeoutError);

			await api.wallet(newWallet).delete();
		});
	});

	describe("Bitcoin", function () {
		const options = {
			bitcoinNetwork: BITCOIN_NETWORK.TESTNET,
			bitcoinTxConfirmations: BITCOIN_TX_CONFIRMATIONS.NONE,
			bitcoinTxSpeed: BITCOIN_TX_SPEED.FAST,
			bitcoinMaxFeeRate: 2000
		};

		it("should wait for a Bitcoin tx", async function () {
			this.timeout(80e3); // could take a while

			const fastApi = new Waas(options);
			const safeApi = new Waas({ ...options, bitcoinTxConfirmations: BITCOIN_TX_CONFIRMATIONS.NONE });

			const { wallet: newWallet } = await fastApi.wallet().create();
			const { address: newWalletAddress } = await fastApi.wallet(newWallet).btc().get();
			const { hash } = await fastApi.wallet(wallet).btc().send({ to: newWalletAddress, amount: "0.000128" });

			const response = await safeApi.btc(hash).wait(60e3);
			console.log(response);

			await fastApi.wallet(newWallet).delete();
		});

		it("should time out for a Bitcoin tx", async function () {
			this.timeout(60e3);

			const fastApi = new Waas(options);
			const safeApi = new Waas({ ...options, bitcoinTxConfirmations: BITCOIN_TX_CONFIRMATIONS.SECURE });

			const { wallet: newWallet } = await fastApi.wallet().create();
			const { address: newWalletAddress } = await fastApi.wallet(newWallet).btc().get();
			const { hash } = await fastApi.wallet(wallet).btc().send({ to: newWalletAddress, amount: "0.000128" });

			await assert.rejects(async () => safeApi.btc(hash).wait(1e3), TimeoutError);

			await fastApi.wallet(newWallet).delete();
		});
	});

	describe("Request", function () {

		const options = {
			ethereumNetwork: ETHEREUM_PUBLIC_NETWORK.ROPSTEN, // All tests execute on the ropsten testnet
		};
		this.timeout(160e3);

		it("should wait for an asynchronous request", async function () {

			const api = new Waas(options);

			const { wallet: newWallet } = await api.wallet().create();
			const { address: newWalletAddress } = await api.wallet(newWallet).eth().get();
			// Use the asynchronous sending of Ethereum transactions as an example, because this returns a request object.
			// One could also test it with any other method that returns this type.
			const txReq = await api.wallet(wallet).eth().sendAsync({ to: newWalletAddress, amount: "0.0001" });

			const success = await txReq.wait(120e3, 1e3);
			console.log(success);

			await api.wallet(newWallet).delete();
		});

		it("should wait for an asynchronous request with given id", async function () {

			const api = new Waas(options);
			const { wallet: newWallet } = await api.wallet().create();
			const { address: newWalletAddress } = await api.wallet(newWallet).eth().get();

			// Perform an asynchronous Ethereum transaction to obtain a request ID.
			// This could also be any other action that returns a request object.
			const { id } = await api.wallet(wallet).eth().sendAsync({ to: newWalletAddress, amount: "0.0001" });

			const success = await api.request(id).wait(120e3, 1e3);
			console.log(success);

			await api.wallet(newWallet).delete();
		});

		it("should time out for an asynchronous request", async function () {
			this.timeout(60e3);

			const api = new Waas(options);

			const { wallet: newWallet } = await api.wallet().create();
			const { address: newWalletAddress } = await api.wallet(newWallet).eth().get();
			// Use the asynchronous sending of Ethereum transactions as an example, because this returns a request object.
			// One could also test it with any other method that returns this type.
			const txReq = await api.wallet(wallet).eth().sendAsync({ to: newWalletAddress, amount: "0.0001" });

			await assert.rejects(async () => txReq.wait(1e3));

			await api.wallet(newWallet).delete();
		});

	});

});
