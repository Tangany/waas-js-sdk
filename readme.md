<div align="center">
  <a href="https://tangany.com">
    <img src="https://raw.githubusercontent.com/Tangany/cloud-wallet/master/docs/tangany.gif"  alt="Tangany" width="50%" />
  </a>
  <h1>Tangany Wallet as a Service SDK</h1>
</div>

node.js wrapper for [Tangany WaaS](https://tangany.com)

[![NPM version](https://raw.githubusercontent.com/Tangany/waas-js-sdk/master/docs/package-badge.svg?sanitize=true)](https://www.npmjs.com/package/@tangany/waas)
[![WaaS API version](https://raw.githubusercontent.com/Tangany/waas-js-sdk/master/docs/sdk-badge.svg?sanitize=true)](https://tangany.docs.stoplight.io/)

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
   let skiptoken = undefined;

    async function listNextPage () {
        const res = await api.wallet().list(skiptoken);
        skiptoken = res.skiptoken;

        return res;
    }

    do {
        const { list } = await listNextPage();
        console.log(list);
    }
    while (!!skiptoken); // fetch until no skiptoken is returned in the response
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
ethereumTxConfirmations |  Amount of block confirmations required to consider an Ethereum transaction as valid. The levels correspond with following target block confirmations amounts (# of confirmations): `none`: 0, `default`: 1, `secure`: 12  | `default` |
ethereumTxSpeed |  Additional gas fee that is added to the base gas fee for the given Ethereum network to speed up the mining process of the transaction. The usage of `none` value may result in the transaction never gets mined and is only intended to use for custom Ethereum networks that employ zero gas price policies. The speed levels correspond with following Ethereum fees (in gwei): `none`: 0, `slow`: 2, `default`: 5, `fast`: 15 | `default` |
ethereumGasPrice | Enforces custom base transaction fee in wei. This prevents the dynamic gas price calculation by the network and nullifies `ethereumTxSpeed`. Example: `7000000000` | `auto` |
useGasTank | Allows to pre-fund the transaction fee for the desired wallet transaction. Supported values: `false`, `true` | `false`
bitcoinNetwork | Public Bitcoin network name. Supported networks: `bitcoin`, `testnet` | `bitcoin` |
bitcoinTxConfirmations | Minimum amount of block confirmations required for Bitcoin balance outputs ("utxo", "coins") to be included in the total wallet balance calculation. The exclusion of unconfirmed outputs prevents the posthumous invalidation of own wallet transaction by the parent utxo sending party. The levels correspond with following target block confirmations amounts (# of confirmations): `none`: 0, `default`: 1, `secure`: 6 | `default` |
bitcoinTxSpeed | Defines the target amount of blocks for the transaction to be included to the Bitcoin network. Faster inclusion requires a higher transaction fee. The fee is calculated in real time based on the network state and can be limited by the `header-bitcoin-max-fee-rate` option. The effective transaction delay can be calculated by multiplying the target confirmation blocks with the Bitcoin block time of 10 minutes (e.g. `slow` yields an block inclusion time of approx. 4h). The speed levels correspond with following block times (target blocks): `slow`: 24, `default`: 6, `fast`: 2 | `default` |
bitcoinMaxFeeRate | Defines the maximum allowed fee rate in satoshi per byte for a Bitcoin transaction. Prevents from spending absurdly high transaction fees during block fee peaks | 500 |

###  More examples
For more examples check out the tests (e.g. [./test/*.e2e.js](./test/ethereum.e2e.js))

#### Wallet interface
*Global wallet management*
https://tangany.docs.stoplight.io/api/wallet/

````javascript

(async () => {
    const api = new Waas();
    // list all wallets
    const { list } = await api.wallet().list();
    //  create a new wallet
    const { wallet, security } = await api.wallet().create("some-other-wallet", false);
    //  fetch a wallet
    const { created } = await api.wallet(wallet).get();
    //  delete a wallet
    const { scheduledPurgeDate, recoveryId } = await api.wallet(wallet).delete();
})();
````

#### General Ethereum interface
*Ethereum calls that are not wallet based*
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
*Wallet based Ethereum calls*
https://tangany.docs.stoplight.io/api/ethereum/
````javascript
(async () => {
    const api = new Waas().wallet("my-wallet");
    // send Ether
    const { hash } = await api.eth().send({to: someOtherWalletAddress, amount: "0.043", data: "0xf03"});
    // send Ether asynchronously (see examples for request interface to retrieve status details)
    const req = await api.eth().sendAsync({to: someOtherWalletAddress, amount: "0.043", data: "0xf03"});
    // create a signed transaction that can be manually transmitted
    const { rawTransaction } = await api.eth().sign({to: someOtherWalletAddress, amount: "0.043", data: "0xf03"});
    // get eth balance and wallet address
    const { currency, balance, address } = await api.eth().get();
})();
````

#### Ethereum ERC20 token interface for wallet
*Wallet based calls for Ethereum ERC20 token management*
https://tangany.docs.stoplight.io/api/ethereum-erc20
````javascript
(async () => {
    const api = new Waas().wallet("my-wallet").eth().erc20(tokenAddress);
    // send token
    const { hash } = await api.send({to: someOtherWalletAddress, amount: "0.043"});
    // get token balance
    const { currency, balance, address } = await api.get();
     // mint token
    await api.mint({amount: "12.291", to: someOtherWalletAddress}); // assuming myWalletAddress is erc20token's minter
    // approve token withdrawal
    await api.approve({to: someOtherWalletAddress, amount: "213"});
    // withdraw pre-approved tokens
    await new Waas().wallet("some-other-wallet").eth().erc20(tokenAddress).transferFrom({from: myWalletAddress, amount: "213"});
    // burn token
    await new Waas().wallet("some-other-wallet").eth().erc20(tokenAddress).burn({amount: "2"});
})();
````

#### Universal Ethereum Smart Contract interface for wallet
[*Wallet based calls for universal smart contract token management*](https://docs.tangany.com/?version=9bc7df56-b03b-4b25-9697-59aea9774174#945c237f-5273-4e85-bf9d-1ba2b132df17)
````javascript
(async () => {
    const api = new Waas().wallet("my-wallet").eth().contract(tokenAddress);
    // send token asynchronously (see examples for request interface to retrieve status details)
    const req = api.sendAsync({
        function: "transfer(address,uint256)",
        inputs: [someOtherWalletAddress, "2500000000000000"]
    });
})();
````

#### General Bitcoin interface
*Bitcoin calls that are not wallet based*
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
*Wallet based Bitcoin calls*
https://tangany.docs.stoplight.io/api/bitcoin/
````javascript
(async () => {
    const api = new Waas().wallet("my-wallet");
    // estimate fee for a transaction
    const { fee, feeRate } = await api.btc().estimateFee({to: someAddress, amount: "0.021"});
    // send BTC to a single recipient
    const { hash } = await api.btc().send({to: someAddress, amount: "0.021"});
    // send BTC to multiple recipients
    await api.btc().send([{to: someAddress, amount: "0.324"}, {to: someOtherAddress, amount: "0.021"}]);
    // create a signed transaction that can be manually transmitted
    const { rawTransaction } = await api.btc().sign({to: someAddress, amount: "0.021"});
    // get BTC balance and wallet address
    const { balance,address,currency } = await api.btc().get();
})();
````

#### Request interface
[*Calls to obtain the status of asynchronous requests*](https://docs.tangany.com/?version=9bc7df56-b03b-4b25-9697-59aea9774174#a6351116-3e2c-4f02-add8-d424c6212f60)
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

## Affinity Cookies
WaaS employs its own load-balanced full-node backend to transmit transactions to the blockchains. Due to the nature of blockchain, full nodes sync their states only in the event of a new block. One implication of this behavior is that sending multiple transactions from the same wallet during a time frame of a single block may lead to an overlap of backend memory pool assignments which subsequent may result in transactions being cancelled and discarded from the blockchain.

E.g. two Ethereum transactions sent to different full nodes from the same wallet shortly one after the other may be assigned the same nonce number by two different full nodes in the backend resulting in Ethereum, by specification, cancelling the former of the two transactions.

To prevent such pooling issues, WaaS supports sticky sessions using the affinity cookies.

Although each `Waas` instance does automatically store its individual affinity cookie after a API call, racing conditions may occur when sending multiple simultaneous transactions from a new instance. To prevent such racing conditions it is advised to pre-establish a sticky session using e.g. `await waas.eth().fetchAffinityCookie()`.

Check out the example implementation in [test/limiter.e2e.js](test/limiter.e2e.js) where a high amount of non-overlapping Ethereum transactions are transmitted simultaneously via pre-established sticky session.

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
Full API documentation is available at https://tangany.docs.stoplight.io/

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
