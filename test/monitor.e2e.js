const { config } = require("dotenv");
const assert = require("assert");
const { checkEnvVars } = require("./helpers");
const { Waas } = require("../dist");
const { resolve } = require("path");
const { EthereumPublicNetwork } = require("../src/waas");

const path = resolve(process.cwd(), ".env");
config({ path });
checkEnvVars();

describe("Sample workflow with transaction monitors", function () {

	this.timeout(60e3);

	const wallet = process.env.E2E_WALLET;
	const ethWalletApi = new Waas({ ethereumNetwork: EthereumPublicNetwork.ROPSTEN, }).wallet(wallet).eth();

	let createdMonitor;

	function assertContext () {
		assert.ok(createdMonitor, "This test cannot be run without context information");
	}

	it("should list all existing Ethereum monitors", async function () {
		for await (const page of ethWalletApi.monitor().list()) {
			assert.ok(page.hits.total);
			assert.ok(page.list.length);
		}
	});

	it("should create a monitor", async function () {
		const { monitor } = await ethWalletApi.monitor().create({
			description: "This is a test monitor",
			target: "transaction",
			configuration: {},
			webhook: {
				method: "post",
				url: "http://myservice.com"
			}
		});
		assert.ok(monitor);
		createdMonitor = monitor;
	});

	it("should be possible to retrieve the created monitor", async function () {
		assertContext();
		try {
			const result = await ethWalletApi.monitor(createdMonitor).get();
			assert.ok(result.monitor, createdMonitor);
		} catch (e) {
			assert.fail("Created monitor could not be retrieved");
		}
	});

	it("should partially update a monitor", async function () {
		assertContext();
		const specificMonitorApi = ethWalletApi.monitor(createdMonitor);

		const description = "Any new description";
		const webhook = { url: "https://new-service.com", method: "get" };

		const originalMonitor = await specificMonitorApi.get();
		const updatedMonitor = await specificMonitorApi.update({ description, webhook });

		// Verify that no property has changed except the ones we wanted to update
		assert.strictEqual(updatedMonitor.description, description);
		assert.deepStrictEqual(updatedMonitor.webhook, webhook);
		delete originalMonitor.description;
		delete originalMonitor.webhook;
		delete originalMonitor.updated;
		delete updatedMonitor.description;
		delete updatedMonitor.webhook;
		delete updatedMonitor.updated;
		assert.deepStrictEqual(originalMonitor, updatedMonitor);
	});

	it("should replace a monitor", async function () {
		assertContext();

		const newObj = {
			target: "transaction",
			description: "A replaced description",
			webhook: {
				url: "https://another-service.com",
				method: "post",
			},
			configuration: {
				direction: "in",
			},
		};
		const updatedMonitor = await ethWalletApi.monitor(createdMonitor).replace(newObj);

		assert.strictEqual(updatedMonitor.target, newObj.target);
		assert.strictEqual(updatedMonitor.description, newObj.description);
		assert.deepStrictEqual(updatedMonitor.webhook, newObj.webhook);
		assert.deepStrictEqual(updatedMonitor.configuration, newObj.configuration);
	});

	it("should delete the created monitor", async function () {
		assertContext();
		const specificMonitorApi = ethWalletApi.monitor(createdMonitor);
		await assert.doesNotReject(() => specificMonitorApi.delete());
		await assert.rejects(() => specificMonitorApi.get(), /Monitor not found/);
	});

});
