const { config } = require("dotenv");
const assert = require("assert");
const { checkEnvVars } = require("./helpers");
const { Waas } = require("../dist");
const { resolve } = require("path");
const path = resolve(process.cwd(), ".env");
const { EthereumPublicNetwork } = require("../src/waas");

config({ path });
checkEnvVars();

describe("Example workflow for reading Ethereum blockchain data", function () {

	this.timeout(7500);

	const wallet = process.env.E2E_WALLET;
	const api = new Waas({ ethereumNetwork: EthereumPublicNetwork.MAINNET });

	it("should read a limited number of transactions for a given block", async function () {
		const query = {
			blocknr: "8000000",
			sort: "valuedesc",
			limit: "2",
			index: "4",
		};
		const txs = await api.eth().getTransactions(query);

		// Querying the result set once for the next and then the previous one should return the initial set of transactions.
		// Deep comparison is not possible because the functions in the objects are not regarded as identical.
		// Therefore we only compare the hashes.
		const nextPage = await txs.next();
		const actual = await nextPage.previous();
		assert.deepStrictEqual(actual.list.map(i => i.hash), txs.list.map(i => i.hash));
	});

	it("should read transactions for a specific wallet", async function () {
		const query = {
			direction: "in",
			limit: 2,
			index: 2,
		};
		const txs = await api.wallet(wallet).eth().getTransactions(query);
		for (const elem of txs.list) {
			const details = await elem.get();
			console.log(`Details for Tx ${elem.hash}:`);
			console.log(JSON.stringify(details, null, 2) + "\n");
		}
	});

	it("should be possible to call next() until all data has been read", async function () {
		const query = {
			from: "0x9A67CaedE861007e59487227F6910bd774f9D5F7",
			limit: 3
		};
		let currentResultPage = await api.eth().getTransactions(query);
		do {
			const hashes = currentResultPage.list.map(item => item.hash);
			console.log(`Hashes of current result page:\n${hashes}`);
			currentResultPage = await currentResultPage.next();
		} while (currentResultPage !== null);
	});

	it("should read transaction events for a specific contract", async function () {
		const ropstenApi = new Waas({ ethereumNetwork: EthereumPublicNetwork.ROPSTEN });
		const events = await ropstenApi.eth()
			.contract("0xa7a0faa59b29f94ccba78979b2b6980be3f98d7a")
			.getEvents({ event: "CardsMinted", limit: 2 });
		console.log(`${events.hits.total} results found. The first 2 are displayed below:`);
		for (const elem of events.list) {
			const details = await elem.get();
			console.log(details);
		}
	});

	it("should read a specific event for given transaction and index", async function () {
		const ropstenApi = new Waas({ ethereumNetwork: EthereumPublicNetwork.ROPSTEN });
		const txHash = "0x5b70ad23e5534bb989b32a547fef5218f7be3461d0155e9c679c3eba352bc20e";
		const logIndex = 96;
		const e = await ropstenApi.eth(txHash).getEvent(logIndex);
		console.log(`Event details for log index ${logIndex} of ${txHash}:`);
		console.log(e);
	});

});
