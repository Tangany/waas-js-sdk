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

	this.timeout(75e3);
	const wallet = process.env.E2E_WALLET;
	const api = new Waas({ ethereumNetwork: EthereumPublicNetwork.MAINNET });

	it("should iterate over all search results for given wallet", async function () {
		const query = {
			blocknr: "8000000",
			sort: "nonceDesc",
			limit: "40",
		};
		const iterable = api.eth().getTransactions(query); // can be used to iterate forward in a for await of loop
		const iterator = iterable[Symbol.asyncIterator](); // can be used to iterate forward and backward manually

		// iterate manually
		const firstPageList = await iterator.next();
		console.log(`Fetched the first page with ${firstPageList.value.list.length} results of total ${firstPageList.value.hits.total}. Fetching the details for the first result`);
		const firstTxData = await firstPageList.value.list[0].get();
		console.log(firstTxData);

		const secondPageList = await iterator.next();
		console.log(`Fetched the second page with ${secondPageList.value.list.length} results of total ${secondPageList.value.hits.total}. Fetching the details for the first result`);
		const secondTxData = await secondPageList.value.list[0].get();
		console.log(secondTxData);

		const firstPageListAgain = await iterator.previous();
		console.log(`Fetched the first page again with ${firstPageListAgain.value.list.length} results of total ${firstPageListAgain.value.hits.total}. Fetching the details for the first result`);
		const firstTxAgainData = await firstPageListAgain.value.list[0].get();
		console.log(firstTxAgainData);

		// automatically iterate forward through the rest of the results
		for await (const a of iterable) {
			console.log(`Fetched the next page with ${a.list.length} results of total ${a.hits.total}. Fetching the details for the first result`);
			console.log(await a.list[0].get());
		}
	});

	it("should read a limited number of transactions for a given block", async function () {
		const query = {
			blocknr: "8000000",
			sort: "valuedesc",
			limit: "2",
			index: "4",
		};
		const iterable = api.eth().getTransactions(query);
		const iterator = iterable[Symbol.asyncIterator]();

		// Querying the result set once for the next and then the previous one should return the initial set of transactions.
		// Deep comparison is not possible because the functions in the objects are not regarded as identical.
		// Therefore we only compare the hashes.
		const actual = (await iterator.next()).value;
		await iterator.next(); // move one page forward
		const candidate = (await iterator.previous()).value; // move one page backwards and get the values

		assert.deepStrictEqual(actual.list.map(i => i.hash), candidate.list.map(i => i.hash));
	});

	it("should read transactions for a specific wallet", async function () {
		const walletEthAddress = (await api.wallet(wallet).eth().get()).address;
		const iterable = api.wallet(wallet).eth().getTransactions({
			limit: 8,
			index: 2,
			direction: "in"
		});
		const iterator = iterable[Symbol.asyncIterator]();
		const elem = (await iterator.next()).value;
		const someTx = await elem.list[0];
		const details = await someTx.get();
		console.log(`Details for Tx ${someTx.hash}:`);
		console.log(JSON.stringify(details, null, 2) + "\n");
		assert.strictEqual(walletEthAddress, details.to);
	});

	it("should be possible to call next() until all data has been read", async function () {
		const query = {
			from: "0x9A67CaedE861007e59487227F6910bd774f9D5F7",
			limit: 3
		};
		let iterable = api.eth().getTransactions(query);
		const iterator = await iterable[Symbol.asyncIterator]();
		let currentResultPage = (await iterator.next()).value;
		let done = false;
		do {
			const hashes = currentResultPage.list.map(item => item.hash);
			console.log(`Hashes of current result page:\n${hashes}`);
			({ value: currentResultPage, done } = await iterator.next());
		} while (done === false);
	});

	it("should read transaction events for a specific contract", async function () {
		const ropstenApi = new Waas({ ethereumNetwork: EthereumPublicNetwork.ROPSTEN });
		const iterable = ropstenApi.eth()
			.contract("0xa7a0faa59b29f94ccba78979b2b6980be3f98d7a")
			.getEvents({ event: "CardsMinted", limit: 2 });
		const iterator = await iterable[Symbol.asyncIterator]().next();
		const events = iterator.value;
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
