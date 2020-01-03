const { getRandomEthereumAddress } = require("./helpers");
const { Waas, ETHEREUM_PUBLIC_NETWORK, ETHEREUM_TX_SPEED } = require("../dist");
const { config } = require("dotenv");
const { resolve } = require("path");
const debug = require("debug")("waas-js-sdk:wait-e2e");
const assert = require("assert");
const path = resolve(process.cwd(), ".env");

process.env.DEBUG = "waas-js-sdk:*"; // force enable logging
config({ path });

console.info("this suite only works with a pre-set .env file with api credentials in project's root");
["CLIENT_ID", "CLIENT_SECRET", "SUBSCRIPTION", "VAULT_URL", "E2E_WALLET", "E2E_TOKEN"].map(v => {
	if (!process.env[v]) {
		throw new Error(`process.env.${v} not defined`);
	}
});

describe("limiter", function () {
	const wallet = process.env.E2E_WALLET;
	const options = {
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		subscription: process.env.SUBSCRIPTION,
		vaultUrl: process.env.VAULT_URL,
		ethereumNetwork: ETHEREUM_PUBLIC_NETWORK.ROPSTEN, // All tests execute on the ropsten testnet
	};

	it("should fetch a boatload of balance requests and not choke", async function () {
		this.timeout(120e3);

		const api = new Waas(options);
		const load = [];

		for (let i = 0; i < 100; i++) {
			load.push(api.wallet(wallet).eth().get().then(({ data }) => debug({ data })));
		}
		await Promise.all(load);
	});

	it("should send a boatload of transactions that must propagate to the blockchain", async function () {
		this.timeout(120e3);

		const api = new Waas({ ...options, ethereumTxSpeed: ETHEREUM_TX_SPEED.FAST });
		const ethereumAddressGen = getRandomEthereumAddress();
		await api.eth().fetchAffinityCookie(); // maintain connection to the same ethereum full node endpoint
		const load = [];

		for (let i = 0; i < 25; i++) {
			const to = ethereumAddressGen.next().value; // generate a sequence of pseudo-random ethereum addresses

			load.push(api.wallet(wallet).eth()
				.send({ amount: "0.00001", to })
				.then(({ data: { hash } }) => {
					debug({ to, hash });

					return hash;
				}));
		}
		const hashes = await Promise.all(load); // send all at once via the limiter

		for (const tx of hashes) {
			const { data } = await api.eth(tx).get();
			debug({ ...data, tx });
			assert.notStrictEqual(data.status, "unknown"); // each tx must propagate to the blockchain
		}
	});
});
