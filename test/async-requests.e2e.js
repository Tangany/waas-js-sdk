const { config } = require("dotenv");
const { resolve } = require("path");
const { checkEnvVars } = require("./helpers");
const { Waas } = require("../dist");
const { EthereumPublicNetwork } = require("../src/waas");
const assert = require("assert");

const path = resolve(process.cwd(), ".env");
config({ path });
checkEnvVars();

describe("Sample workflow with asynchronous requests", function () {

	const timeout = 160e3;
	this.timeout(timeout);
	this.slow(timeout / 3);

	const api = new Waas({
		ethereumNetwork: EthereumPublicNetwork.ROPSTEN,
	});

	const wallet = process.env.E2E_WALLET;

	// Variables to store information across the workflow steps
	let createdWallet;

	before(async function () {
		// Create a wallet to send some ether there for testing
		const { wallet } = await api.wallet().create();
		createdWallet = wallet;
		console.log(`Created wallet '${wallet}'`);
	});

	after(async function () {
		const { recoveryId } = await api.wallet(createdWallet).delete();
		console.log(`Soft deleted wallet '${recoveryId}'`);
	});

	describe("Ethereum", function () {
		let createdWalletEthAddress;
		let txRequest;

		before(async function () {
			// Get the Ethereum-specific address of the wallet
			// Execute this at the beginning of the test suite and not in a test because it is not a meaningful step of this workflow (for asynchronous requests)
			const { address } = await api.wallet(createdWallet).eth().get();
			createdWalletEthAddress = address;
		});

		it("should start an asynchronous request that sends some ether", async function () {
			txRequest = await api.wallet(wallet).eth().sendAsync({ to: createdWalletEthAddress, amount: "0.00125" });
			assert.ok(txRequest.id);
			console.log(`Started asynchronous request with id '${txRequest.id}'`);
		});

		it("should return the process status for the request", async function () {
			// Query the request status using the given Request object instance
			const status = await txRequest.get();
			assert.ok(status);
			console.log(`Request status: ${JSON.stringify(status, null, 2)}`);

			// Query the request status by passing an id
			const statusById = await api.request(txRequest.id).get();
			assert.ok(statusById);
		});

	});

});
