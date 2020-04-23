const { Waas } = require("../dist");
const { ConflictError } = require("../dist/errors");
const { config } = require("dotenv");
const assert = require("assert");
const { checkEnvVars } = require("./helpers");
const { resolve } = require("path");
const path = resolve(process.cwd(), ".env");

config({ path });
checkEnvVars();

/**
 * This test will create a wallet with a random uuid name in the current subscription and delete it afterwards. Use with caution!
 */
describe("WaaS sample wallet workflow", function () {
	let createdWallet = undefined;
	this.timeout(10e3);

	const api = new Waas();

	it("should list available wallets", async function () {
		const allWallets = await api.wallet().list();
		assert.ok(allWallets.list.length);
		console.log("wallets list", allWallets);

		if (allWallets.skiptoken) {
			console.log(`fetching next list page for skiptoken`);
			const nextList = await api.wallet().list(allWallets.skiptoken);
			assert.ok(nextList.list.length);
			assert.strictEqual(allWallets.list.find(l => l.wallet === nextList.list[0].wallet), undefined);
			console.log("wallet list next page", nextList);
		}
	});

	it("should create a new wallet", async function () {
		createdWallet = (await api.wallet().create()).wallet;
		assert.ok(createdWallet);
	});

	it("should fail creating a wallet with occupied name", async function () {
		assert.ok(createdWallet, "cannot run without previous tests");
		await assert.rejects(async () => api.wallet().create(createdWallet), ConflictError);
	});

	it("should delete the created wallet", async function () {
		this.timeout(30e3);

		assert.ok(createdWallet, "cannot run without previous tests");
		const { recoveryId } = await api.wallet(createdWallet).delete();
		assert.strictEqual(recoveryId, createdWallet);
	});
});
