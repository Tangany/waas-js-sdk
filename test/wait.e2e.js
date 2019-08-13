const { WaasApi, ETHEREUM_PUBLIC_NETWORK } = require("../dist");
const { config } = require("dotenv");
const { resolve } = require("path");
const moxios = require("moxios");
const debug = require("debug")("waas-js-sdk:wait-e2e");

const path = resolve(process.cwd(), ".env");
config({ path });

describe("wait", function () {
	
	it("should wait for an Ethereum tx", async function () {
		this.timeout(60e3);
		
		const api = new WaasApi({
			clientId: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			subscription: process.env.SUBSCRIPTION,
			vaultUrl: process.env.VAULT_URL,
			ethereumNetwork: ETHEREUM_PUBLIC_NETWORK.ROPSTEN,
		});
		
		const { wallet: newWallet } = (await api.wallet().create()).data;
		const { address: newWalletAddress } = (await api.wallet(newWallet).eth().get()).data;
		const { hash } = (await api.wallet("func-spec").eth().send({ to: newWalletAddress, amount: "0.000128" })).data;
		
		const response = await api.eth(hash).wait(50e3);
		debug(response.data);
		
		await api.wallet(newWallet).delete();
	});
});
