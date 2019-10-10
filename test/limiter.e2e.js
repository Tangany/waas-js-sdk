const { Waas, ETHEREUM_PUBLIC_NETWORK, BITCOIN_NETWORK, BITCOIN_TX_CONFIRMATIONS, BITCOIN_TX_SPEED, TimeoutError } = require("../dist");
const { config } = require("dotenv");
const { resolve } = require("path");
const debug = require("debug")("waas-js-sdk:wait-e2e");
const assert = require("assert");
const path = resolve(process.cwd(), ".env");

process.env.DEBUG = "waas-js-sdk:*"; // force enable logging
config({ path });

console.info("this suite only works with a pre-set .env file with api credentials in project's root");

describe("limiter", function () {
	
	const wallet = process.env.WALLET;
	const options = {
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		subscription: process.env.SUBSCRIPTION,
		vaultUrl: process.env.VAULT_URL,
		ethereumNetwork: ETHEREUM_PUBLIC_NETWORK.ROPSTEN,
	};
	
	it("should send a boatload of get requests and not choke", async function () {
		this.timeout(120e3);
		
		const api = new Waas(options);
		const load = [];
		
		for (let i = 0; i < 100; i++) {
			load.push(api.wallet(wallet).eth().get().then(({ data }) => debug({ data })));
		}
		await Promise.all(load);
	});
});
