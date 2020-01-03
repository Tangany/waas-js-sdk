<div align="center">
  <a href="https://tangany.com">
    <img src="https://raw.githubusercontent.com/Tangany/cloud-wallet/master/docs/tangany.gif"  alt="Tangany" width="50%" />
  </a>
  <h1>Official Javascript SDK for Tangany Wallet as a Service API</h1>
</div>

[Axios](https://github.com/axios/axios) based node.js wrapper for [Tangany WaaS](https://tangany.com)

[![NPM version](https://raw.githubusercontent.com/Tangany/waas-js-sdk/master/docs/package-badge.svg?sanitize=true)](https://www.npmjs.com/package/@tangany/waas-js-sdk)
[![WaaS API version](https://raw.githubusercontent.com/Tangany/waas-js-sdk/master/docs/sdk-badge.svg?sanitize=true)](https://tangany.docs.stoplight.io/)

## Getting started
Install the [npm package]
```
npm install @tangany/waas-js-sdk
```

Configure the SDK
```javascript
const { Waas } = require("@tangany/waas-js-sdk");

// load the environment variables via e.g. dotenv
const dotenv = require("dotenv");
dotenv.config();

// pass the configuration to instantiate the SDK
const api = new Waas({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        subscription: process.env.SUBSCRIPTION,
        vaultUrl: "https://my-vault.some.cloud.tld"
    });

// e.g. fetch all client wallets
(async () => {
   let skiptoken = undefined;

    async function listNextPage () {
        const {data} = await api.wallet().list(skiptoken);
        skiptoken = data.skiptoken;

        return data;
    }

    do {
        const { list } = await listNextPage();
        console.log(list);
    }
    while (!!skiptoken); // fetch until no skiptoken is returned in the response
})();
```

### Constructor options
WaaS configuration headers are passed as options into the constructor.

option | description | mandatory
--- | --- | ---
clientId | Service to service authentication client ID | ✔
clientSecret | Service to service authentication client secret | ✔
subscription | Product subscription key | ✔
vaultUrl | Tangany vault url. Example: `https://my-vault.some.cloud.tld` | ✔
ethereumNetwork | Public Ethereum network to operate in (`mainnet`, `ropsten`) or private Ethereum network Custom RPC URL for a private Ethereum network to operate in (example: `http://somenetwork.example.org:8540`). Defaults to `mainnet`|
ethereumTxSpeed |  Additional gas fee that is added to the base gas fee for the given Ethereum network to speed up the mining process of the transaction. The usage of `none` value may result in the transaction never gets mined and is only intended to use for custom Ethereum networks that employ zero gas price policies. The speed levels correspond with following Ethereum fees (in gwei): `none`: 0, `slow`: 2, `default`: 5, `fast`: 15. Defaults to `default`. |
bitcoinNetwork | Public Bitcoin network name. Supported networks: `bitcoin`, `testnet`. Defaults to `bitcoin` |
bitcoinTxConfirmations | Minimum amount of block confirmations required for Bitcoin balance outputs ("utxo", "coins") to be included in the total wallet balance calculation. The exclusion of unconfirmed outputs prevents the posthumous invalidation of own wallet transaction by the parent utxo sending party. The levels correspond with following target block confirmations amount (# of confirmations): `none`: 0, `default`: 1, `secure`: 6. Defaults to `default`. |
bitcoinTxSpeed | Defines the target amount of blocks for the transaction to be included to the Bitcoin network. Faster inclusion requires a higher transaction fee. The fee is calculated in real time based on the network state and can be limited by the `header-bitcoin-max-fee-rate` option. The effective transaction delay can be calculated by multiplying the target confirmation blocks with the Bitcoin block time of 10 minutes (e.g. `slow` yields an block inclusion time of approx. 4h). The speed levels correspond with following block times (target blocks): `slow`: 24, `default`: 6, `fast`: 2.  Defaults to `default` |
bitcoinMaxFeeRate | Defines the maximum allowed fee rate in satoshi per byte for a Bitcoin transaction. Prevents from spending absurdly high transaction fees during block fee peaks |

###  More examples
For more examples check out the tests (e.g. [./test/*.e2e.js](./test/ethereum.e2e.js))

#### Wallet interface
*Global wallet management*
https://tangany.docs.stoplight.io/api/wallet/

````javascript

(async () => {
    const api = new Waas(options);
    // list all wallets
    const { list } = (await api.wallet().list()).data;
    //  create a new wallet
    const { wallet, security } = (await api.wallet().create("some-other-wallet", false)).data;
    //  fetch a wallet
    const { created } = (await api.wallet(wallet).get()).data;
    //  delete a wallet
    const { scheduledPurgeDate, recoveryId } = (await api.wallet(wallet).delete()).data;
})();
````

#### General Ethereum interface
*Ethereum calls that are not wallet based*
````javascript
(async () => {
    const api = new Waas(options).eth(txHash);
    // get transaction status
    const { blockNr, isError } = (await api.get()).data;
    // wait until the transaction is mined
    await api.wait(60e3);
})();
````

#### Ethereum interface for wallet
*Wallet based Ethereum calls*
https://tangany.docs.stoplight.io/api/ethereum/
````javascript
(async () => {
    const api = new Waas(options).wallet("my-wallet");
    // send Ether
    const { hash } = (await api.eth().send({to: someOtherWalletAddress, amount: "0.043", data: "0xf03"})).data;
    // get eth balance and wallet address
    const { currency, balance, address } = (await api.eth().get()).data;
})();
````

#### Ethereum ERC20 token interface for wallet
*Wallet based calls for Ethereum ERC20 token management*
https://tangany.docs.stoplight.io/api/ethereum-erc20
````javascript
(async () => {
    const api = new Waas(options).wallet("my-wallet").eth().erc20(tokenAddress);
    // send token
    const { hash } = (await api.send(someOtherWalletAddress, "0.043")).data;
    // get token balance
    const { currency, balance, address } = (await api.get()).data;
     // mint token
    await api.mint("12.291", someOtherWalletAddress); // assuming myWalletAddress is erc20token's minter
    // approve token withdrawal
    await api.approve(someOtherWalletAddress, "213");
    // withdraw pre-approved tokens
    await new Waas(options).wallet("some-other-wallet").eth().erc20(tokenAddress).transferFrom(myWalletAddress, "213");
    // burn token
    await new Waas(options).wallet("some-other-wallet").eth().erc20(tokenAddress).burn("2");
})();
````

#### General Bitcoin interface
*Bitcoin calls that are not wallet based*
````javascript
(async () => {
    const api = new Waas(options).btc(hash);
    // get transaction status
    const { confirmations, status } = (await api.get()).data;
    // wait until the transaction is mined
    await api.wait(20e3, 1e3);
})();
````

#### Bitcoin interface for wallet
*Wallet based Bitcoin calls*
https://tangany.docs.stoplight.io/api/bitcoin/
````javascript
(async () => {
    const api = new Waas(options).wallet("my-wallet");
    // estimate fee for a transaction
    const { fee, feeRate } = (await api.btc().estimateFee({to: someAddress, amount: "0.021"})).data;
    // send BTC to a single recipient
    const { hash } = (await api.btc().send({to: someAddress, amount: "0.021"})).data;
    // send BTC to multiple recipients
    await api.btc().send([{to: someAddress, amount: "0.324"}, {to: someOtherAddress, amount: "0.021"}]);
    // get BTC balance and wallet address
    const { balance,address,currency } = (await api.btc().get()).data;
})();
````

## Affinity Cookies
WaaS employes its own load-balanced full nodes backend to transmit transactions to the blockchains. Due to the nature of blockchain, full nodes sync their states only in the event of a new block. One implication of this behavior is that sending multiple transactions from the same wallet during a time frame of a single block may lead to an overlap of backend memory pool assignments which subsequent may result in transactions being cancelled and discarded from the blockchain.

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

[npm package]: https://www.npmjs.com/package/@tangany/waas-js-sdk
