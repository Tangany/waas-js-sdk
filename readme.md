<div align="center">
  <a href="https://tangany.com">
    <img src="https://raw.githubusercontent.com/Tangany/cloud-wallet/master/docs/tangany.gif"  alt="Tangany" width="50%" />
  </a>
  <h1>Tangany Wallet as a Service SDK</h1>
</div>

node.js wrapper for [Tangany WaaS](https://tangany.com)

[![NPM version](https://raw.githubusercontent.com/Tangany/waas-js-sdk/master/docs/package-badge.svg?sanitize=true)](https://www.npmjs.com/package/@tangany/waas)
[![WaaS API version](https://raw.githubusercontent.com/Tangany/waas-js-sdk/master/docs/sdk-badge.svg?sanitize=true)](https://docs.tangany.com/?version=latest)

## Getting started

Install the [npm package]
```
npm install @tangany/waas
```

Configure the SDK
```javascript
const { Waas } = require("@tangany/waas");
const api = new Waas();

// e.g. fetch all client wallets
(async () => {
    const walletIterable = api.wallet().list({ sort: "createddesc" });
    for await (const page of walletIterable) {
        console.log(`Page with ${page.list.length} of a total of ${page.hits.total} wallets fetched. Details for the first wallet of this page:`);
        console.log(await page.list[0].get());
    }
})();
```

### Constructor options
All configuration headers are optional and can be passed via a configuration object to the `Waas` constructor.
If either the authentication headers or the whole configuration object is omitted from the constructor, the authentication headers are automatically fetched from the environment variables `TANGANY_CLIENT_ID`, `TANGANY_CLIENT_SECRET`, `TANGANY_SUBSCRIPTION` & `TANGANY_VAULT_URL`.

Hence each of the following invocations are valid:
```
new Waas(); // authentication headers are fetched from the environment variables
new Waas({ ethereumNetwork: "ropsten" }); // authentication headers are fetched from the environment variables and merged with the configuration headers argument
new Waas({
    clientId: process.env.MY_CLIENT_ID,
    clientSecret: process.env.MY_CLIENT_SECRET,
    subscription: process.env.MY_SECRET,
    ethereumNetwork: "ropsten",
    ...myOtherOptions
}); // all configuration headers are passed manually
```
#### Available configuration headers

option | description | default value
--- | --- | ---
clientId | Service to service authentication client ID | process.env.TANGANY_CLIENT_ID |
clientSecret | Service to service authentication client secret | process.env.TANGANY_CLIENT_SECRET |
subscription | Product subscription key | process.env.TANGANY_SUBSCRIPTION |
vaultUrl | Tangany vault URL required for all wallet-based calls. Example: `https://my-vault.some.cloud.tld` | process.env.TANGANY_VAULT_URL |
ethereumNetwork | Public Ethereum network to operate in (`mainnet`, `ropsten`) or private Ethereum network Custom RPC URL for a private Ethereum network to operate in (example: `http://somenetwork.example.org:8540`) | `mainnet` |
ethereumTxConfirmations |  Amount of block confirmations required to consider an Ethereum transaction as valid. Either a numeric value or one of the following levels can be set, each corresponding to a number of target block confirmations: `none`: 0, `default`: 1, `secure`: 12  | `default` |
ethereumTxSpeed |  Additional gas fee that is added to the base gas fee for the given Ethereum network to speed up the mining process of the transaction. The usage of `none` value may result in the transaction never gets mined and is only intended to use for custom Ethereum networks that employ zero gas price policies. The speed levels correspond with following Ethereum fees (in gwei): `none`: 0, `slow`: 2, `default`: 5, `fast`: 15 | `default` |
ethereumGasPrice | Enforces custom base transaction fee in wei. This prevents the dynamic gas price calculation by the network and nullifies `ethereumTxSpeed`. Example: `7000000000` | `auto` |
ethereumGas | Enforces custom amount of transaction gas. Example: `21000` | `auto` |
ethereumNonce | Enforces custom transaction nonce. Example: `123` | `auto` |
ethereumChainId | Enforces custom chain id. Example: `9876` | `auto` |
useGasTank | Allows to pre-fund the transaction fee for the desired wallet transaction. Supported values: `false`, `true` | `false`
bitcoinNetwork | Public Bitcoin network name. Supported networks: `bitcoin`, `testnet` | `bitcoin` |
bitcoinTxConfirmations | Minimum amount of block confirmations required for Bitcoin balance outputs ("utxo", "coins") to be included in the total wallet balance calculation. The exclusion of unconfirmed outputs prevents the posthumous invalidation of own wallet transaction by the parent utxo sending party. Either a numeric value or one of the following levels can be set, each corresponding to a number of target block confirmations: `none`: 0, `default`: 1, `secure`: 6 | `default` |
bitcoinTxSpeed | Defines the target amount of blocks for the transaction to be included to the Bitcoin network. Faster inclusion requires a higher transaction fee. The fee is calculated in real time based on the network state and can be limited by the `header-bitcoin-max-fee-rate` option. The effective transaction delay can be calculated by multiplying the target confirmation blocks with the Bitcoin block time of 10 minutes (e.g. `slow` yields an block inclusion time of approx. 4h). The speed levels correspond with following block times (target blocks): `slow`: 24, `default`: 6, `fast`: 2 | `default` |
bitcoinMaxFeeRate | Defines the maximum allowed fee rate in satoshi per byte for a Bitcoin transaction. Prevents from spending absurdly high transaction fees during block fee peaks | 500 |

###  More examples
For more examples check out the tests (e.g. [./test/*.e2e.js](./test/ethereum.e2e.js))

#### Wallet interface
[*Global wallet management*](https://docs.tangany.com/#39e3a3fe-42fa-4188-b64a-12d8258ad98d)
````javascript
(async () => {
    const api = new Waas();

    // Note: Temporarily, list() returns the fully populated list, thus calling the deprecated endpoint to avoid a breaking change.
    // The new endpoint with extended parameters and pagination is used if you pass an object containing the filters instead of a skiptoken.
    // Currently, you must therefore pass an empty object if you want to use the new endpoint with the default settings.
    const { list } = await api.wallet().list();
    const walletIterable1 = api.wallet().list({});
    const walletIterable2 = api.wallet().list({ sort: "createddesc" });
    for await (const {hits, list} of walletIterable2) {
        // Process the data of the current page
    }

    //  create a new wallet (all properties are optional)
    const {wallet, security} = await api.wallet().create({
        wallet: "some-other-wallet",
        useHsm: false,
        tags: [
            {name: "isTest", value: true},
            {name: "another-tag", value: 123}
        ]
    });

    //  fetch a wallet
    const { created } = await api.wallet(wallet).get();

    // partially update a wallet
    const updatedWallet = await api.wallet(wallet).update({
        // The passed tag array overwrites the previous value and therefore must contain all desired values
        tags: [
            {name: "isTest", value: true},
            {name: "additionalTag", value: 456}
        ]
    });

    // replace a wallet
    const { version } = await api.wallet(wallet).replace();

    //  delete a wallet
    const { scheduledPurgeDate, recoveryId } = await api.wallet(wallet).delete();
})();
````

#### Payload signing interface
````javascript
(async () => {
    const api = new Waas().wallet("my-wallet");
    const payload = "arbitrary payload";
    // create signature with default encoding (DER)
    const signatureDer = await api.sign(payload);
    // create signature with IEEE-P1363 encoding
    const signatureP1363 = await api.sign(payload, "ieee-p1363");
    // verify signatures
    const isValidDer = await waas.verifySignature(payload, signatureDer);
    const isValidP1363 = await waas.verifySignature(payload, signatureP1363, "ieee-p1363");
    // DER signatures can also be verified externally using tools such as OpenSSL.
    // For this, the public key is necessary, which may have to be converted depending on the tool.
    const {public: {secp256k1}} = await api.get();
})();
````

#### General Ethereum interface
[*Ethereum calls that are not wallet based*](https://docs.tangany.com/#7b314b47-012c-4baa-b928-dd32c7db1e41)
````javascript
(async () => {
    const api = new Waas().eth(txHash);
    // get transaction status
    const { blockNr, isError } = await api.get();
    // poll until the transaction is mined (for max 60 seconds)
    await api.wait(60e3);
})();
````

#### Ethereum interface for wallet
[*Wallet based Ethereum calls*](https://docs.tangany.com/#4a31e7ea-f62b-44db-81bd-b6802099955e)
````javascript
(async () => {
    const api = new Waas().wallet("my-wallet");
    // estimate transaction fee
    const {gas, gasPrice, fee} = await api.eth().estimateFee({to: someOtherWalletAddress, amount: "0.043", data: "0xf03"});
    // send Ether asynchronously (see examples for request interface to retrieve status details)
    const req = await api.eth().sendAsync({to: someOtherWalletAddress, amount: "0.043", data: "0xf03"});
    // get eth balance and wallet address
    const { currency, balance, address } = await api.eth().get();
})();
````

#### Universal Ethereum Smart Contract interface for wallet
[*Wallet based calls for universal smart contract token management*](https://docs.tangany.com/#945c237f-5273-4e85-bf9d-1ba2b132df17)
````javascript
(async () => {
    const api = new Waas().wallet("my-wallet").eth().contract(tokenAddress);
    const contractCall = {
        function: "transfer(address,uint256)",
        inputs: [someOtherWalletAddress, "2500000000000000"]
    }
    // estimate transaction fee
    const {gas, gasPrice, fee, data} = await api.estimateFee(contractCall);
    // send token asynchronously (see examples for request interface to retrieve status details)
    const req = await api.sendAsync(contractCall);
    // execute readonly contract function on behalf the given wallet
    const balance = await api.call("balanceOf");
})();
````

#### Universal Ethereum Smart Contract interface
````javascript
(async () => {
    const api = new Waas().eth().contract(tokenAddress);
    const supply = await api.call("totalSupply");
    const symbol = await api.call("symbol", ["string"]);
    const balance = await api.call({
        function: "balanceOf(address)",
        inputs: [walletAddress],
        outputs: ["uint256"]
    });
})();
````

#### Ethereum interface for blockchain search queries
````javascript
(async () => {
    const api = new Waas().eth();
    // Receive the AsyncIterable object for the specified search request
    const iterable = api.getTransactions({blocknr: 10430231, sort: "valuedesc", limit: 15});
    // Invoke the iterator to manually query paged results
    const iterator = iterable[Symbol.asyncIterator]();
    // Use pagination to query further results (if available)
    const {value, done} = await iterator.next();
    // Query the details of a transaction
    const txDetails = value.list[0].get();
    // Iterate over all iterable results using for await of
    for await (const iterableValue of iterable){
    	console.log(await iterableValue.list[0].get());
    }
    // Query transactions based on the current wallet context
    const walletTxsIterable = new Waas().wallet("my-wallet").eth().getTransactions({direction: "in", limit: 2});
    // Read transaction events for a specific contract
    const eventsList = (await api.contract(tokenAddress).getEvents({event: "Transfer", limit: 10})[Symbol.asyncIterator]().next()).value;
    const eventDetails = await eventsList[0].get();
    // Query transaction events based on their arguments
    const filteredEventsIterator = await api.contract(tokenAddress).getEvents({
        event: "Transfer",
        argumentFilters: [{position: "to", value: "0x1ec2a77ec126369ad7c7e6fdb03e3d52b79b013d"}]
    });
    // Read an individual event
    const event = await new Waas().eth(txHash).getEvent(logIndex);
})();
````


#### General Bitcoin interface
[*Bitcoin calls that are not wallet based*](https://docs.tangany.com/#2fe57cbc-410e-4141-8161-fd335cfc05c8)
````javascript
(async () => {
    const api = new Waas().btc(hash);
    // get transaction status
    const { confirmations, status } = await api.get();
    // poll every second until the transaction is mined (for max 720 seconds)
    await api.wait(720e3, 1e3);
})();
````

#### Bitcoin interface for wallet
[*Wallet based Bitcoin calls*](https://docs.tangany.com/#11dafda1-03e7-4911-b18f-091e4e2dd94e)
````javascript
(async () => {
    const api = new Waas().wallet("my-wallet");
    // estimate fee for a transaction
    const { fee, feeRate } = await api.btc().estimateFee({to: someAddress, amount: "0.021"});
    // send BTC to a single recipient
    const req1 = await api.btc().sendAsync({to: someAddress, amount: "0.021"});
    // send BTC to multiple recipients
    const sendReq = await api.btc().sendAsync([{to: someAddress, amount: "0.324"}, {to: someOtherAddress, amount: "0.021"}]);
    // get BTC balance and wallet address
    const { balance,address,currency } = await api.btc().get();
    // sweep wallet
    const req = await api.btc().sweepAsync({to: someAddress});
    const { process, status, output } = await req.get();
})();
````

#### Request interface
[*Calls to obtain the status of asynchronous requests*](https://docs.tangany.com/#a6351116-3e2c-4f02-add8-d424c6212f60)
````javascript
(async () => {
    const api = new Waas();
    // execute an arbitrary call to an asynchronous endpoint
    const req = await api.wallet("my-wallet").eth().sendAsync({to: someOtherWalletAddress, amount: "0.539"});
    // retrieve status details
    const { process, status, output } = await req.get();
    // transaction hash is available in the status field as soon as the transaction is executed
    const { hash } = status;
    // once it is confirmed, further details are available as output of the request
    if (process === "Completed") {
        const { hash, blockNr, data, status } = output;
    }
    // obtain the status of a given request id
    const anotherStatus = await api.request("a2e19473b9ec44cf97f71c9d4615e364").get();
})();
````

#### Monitor interface
WaaS monitors use webhooks to inform about transactions that meet the defined criteria.
They can be utilized to reduce status polling when sending transactions or can e.g. notify about in- or outgoing transaction that exceed a certain value.

```javascript
(async () => {
    const waas = new Waas();
    const ethWalletApi = waas.wallet("my-wallet").eth();

    // Get all monitors for all wallets of the current customer with default pagination settings
    const iterable1 = await waas.eth().monitor().list();
    // Get all monitors for wallet called "my-wallet" returned on pages with 15 items each
    const iterable2 = await waas.eth().monitor().list({limit: 15, wallet: "my-wallet"});
    // The previous call is equivalent to this one, which uses the wallet-specific method
    const iterable3 = await ethWalletApi.monitor().list({limit: 15});
    for await (const page of iterable3) {
        for (const monitor of page.list) {
            console.log(await monitor.get());
            await monitor.update({description: "New description"});
        }
    }

    // Create new monitor
    const {monitor, status} = await ethWalletApi.monitor().create(monitorObj);

    // Interact with a specific monitor
    const specificMonitor = ethWalletApi.monitor("any-monitor-id");
    const details = await specificMonitor.get();

    // Partially update monitor
    let updatedMonitor = await specificMonitor.update({description: "New description"});
    updatedMonitor = await specificMonitor.update({
        description: "Another text",
        configuration: {
            // Specify all properties that should be present in `configuration` after the update.
            // This is because the endpoint overrides nested properties.
        }
    });

    // Replace monitor, which requires a complete object, not a partial
    updatedMonitor = await specificMonitor.replace(monitorToWrite);

    // Delete the entire monitor
    await specificMonitor.delete();
})();
```

#### Node status
Get status information about the [Bitcoin](https://docs.tangany.com/#15f3dbb7-84b6-4828-b866-52255f72b2bc)
or [Ethereum](https://docs.tangany.com/#cb2713db-04dc-4003-94f7-b6eeb021a5ad) full node
````javascript
(async () => {
    const api = new Waas();
    const ethStatus = await api.eth().getStatus();
    const btcStatus = await api.btc().getStatus();
})();
````

## Item-wise returning iterables

The asynchronous iterables returned by some methods for searching resources such as wallets or transactions return the full search results page per iteration by default.
Since it may well be more convenient if the iterator returns the individual items like wallets instead of pages, there is the `autoPagination` option.
Then, when iterating e.g. with `for await ... of` the iterable appears as if it were a single list of items, although page-transcending accesses may take place in the background.
The option can be enabled in an additional object argument in the corresponding methods. In the current version it is set to `false` by default.

Typically, the search methods support an optional `limit` parameter that overrides the default setting for the number of hits per page. Even with the `autoPagination` option, `limit` is not to be confused with the total number of resource items (such as wallets) that the iterator returns. However, `limit` can still be used to adjust the pagination mechanism as needed. This is not noticeable when using the item-wise returning iterables, but the number of HTTP requests in the background may differ.

```javascript
(async () => {
    const api = new Waas().eth().monitor();

    const monitorPageIterable = api.list();
    for await (const page of monitorPageIterable) {
        // The number of hits is only available through the iterator because it is the one that returns the pages
        const count = page.hits.total;

        for (const monitor of page.list) {
            const details = await monitor.get();
            await monitor.update({description: "Hello World"});
        }
    }


    const monitorIterable = api.list({}, {autoPagination: true});

    // The number of hits can be accessed independently of the iterator
    const count = (await monitorIterable.hits).total;

    for await (const monitor of monitorIterable) {
        const details = await monitor.get();
        await monitor.update({description: "Hello World"});
    }
})();
```

## Affinity Cookies
WaaS employs its own load-balanced full-node backend to transmit transactions to the blockchains. Due to the nature of blockchain, full nodes sync their states only in the event of a new block. One implication of this behavior is that sending multiple transactions from the same wallet during a time frame of a single block may lead to an overlap of backend memory pool assignments which subsequent may result in transactions being cancelled and discarded from the blockchain.

E.g. two Ethereum transactions sent to different full nodes from the same wallet shortly one after the other may be assigned the same nonce number by two different full nodes in the backend resulting in Ethereum, by specification, cancelling the former of the two transactions.

To prevent such pooling issues, WaaS supports sticky sessions using the affinity cookies.

Although each `Waas` instance does automatically store its individual affinity cookie after a API call, racing conditions may occur when sending multiple simultaneous transactions from a new instance. To prevent such racing conditions it is advised to pre-establish a sticky session using e.g. `await waas.eth().fetchAffinityCookie()`.

Check out the example implementation in [test/limiter.e2e.js](test/limiter.e2e.js) where a high amount of non-overlapping Ethereum transactions are transmitted simultaneously via pre-established sticky session.

## Custom axios settings

The SDK exposes a single [axios](https://github.com/axios/axios) instance to perform all WaaS requests.
For example, this instance can be used to tunnel all SDK requests through a user-defined proxy:

```
const waas = new Waas();
const axios = waas.axios;
axios.defaults.proxy = {
    host: Proxy.host,
    port: Proxy.port,
    auth: {
        username: Proxy.username,
        password: Proxy.password
    }
};
```

Such user-defined settings are not required for standard operations.

## Changelog
All notable changes to this project are documented in the [changelog](./CHANGELOG.MD)

## Testing
Copy `.env.example` to `.env` and enter you WaaS subscription details to be able to run the [tests](./test). Use testnet faucets to charge a wallet with some crypto and paste the name to the `WALLET` variable.

Start the test suite with `npm run test:e2e`

## Debugging
To enable additional logging (e.g. to debug HTTP requests), use following environment variable
```
DEBUG=waas-js-sdk:*
```

## API documentation
Full API documentation is available at https://docs.tangany.com

***
<div align="center">
<p>
<img src="https://raw.githubusercontent.com/Tangany/cloud-wallet/master/docs/logo.svg?sanitize=true"  alt="Tangany" height="50" align="middle" />
</p>
<p>
© 2019 <a href="https://tangany.com">Tangany</a>
</p>
<p>
 <a href="https://tangany.com/imprint/">Imprint</a>
• <a href="https://tangany.com/imprint/">Privacy policy</a>
• <a href="https://tangany.com#newsletter">Newsletter</a>
• <a href="https://twitter.com/tangany_wallet">Twitter</a>
• <a href="https://www.facebook.com/tanganywallet">Facebook</a>
• <a href="https://www.linkedin.com/company/tangany/">LinkedIn</a>
• <a href="https://www.youtube.com/channel/UCmDr1clodG1ov-iX_GMkwMA">YouTube</a>
• <a href="https://github.com/Tangany/">Github</a>
</p>
</div>

[npm package]: https://www.npmjs.com/package/@tangany/waas
