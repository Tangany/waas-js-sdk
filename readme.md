<div align="center">  
  <a href="https://tangany.com">  
    <img src="https://raw.githubusercontent.com/Tangany/cloud-wallet/master/docs/tangany.gif"  alt="Tangany" width="50%" />  
  </a>  
  <h1>Official Javascript SDK for Tangany Wallet as a Service API</h1>      
</div>  

A node.js integration of the [Tangany Wallet as a Service API](https://tangany.com) to be used in a backend scenario.

[![NPM version](https://raw.githubusercontent.com/Tangany/waas-js-sdk/master/docs/package-badge.svg?sanitize=true)](https://www.npmjs.com/package/@tangany/waas-js-sdk)
[![WaaS API version](https://raw.githubusercontent.com/Tangany/waas-js-sdk/master/docs/sdk-badge.svg?sanitize=true)](https://tangany.docs.stoplight.io/)

## Getting started
Install the package
```
npm install @tangany/waas-js-sdk
```

Import the main module
```javascript
const { WaasApi } = require("@tangany/waas-js-sdk");
const { MAINNET } = require("@tangany/waas-js-sdk").ETHEREUM_PUBLIC_NETWORK;

// set the environment variables
const dotenv = require("dotenv");
dotenv.config();

/**
 * fetch all client wallets
 */
(async () => {
    const api = new WaasApi(
        {
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            subscription: process.env.SUBSCRIPTION,
            vaultUrl: "https://my-vault.some.cloud.tld"
        });

    let skiptoken = undefined;
    
    async function listWallets () {
        const data = (await api.wallet().list(skiptoken)).data;
        skiptoken = data.skiptoken;
        
        return data;
    }
    
    do {
        // fetch wallets until no skiptoken is returned in the response
        const { list } = await listWallets();
        console.log(list);
    }
    while (!!skiptoken);
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
ethereumNetwork | Public Ethereum network to operate in (`mainnet`, `ropsten`) or private Ethereum network Custom RPC URL for a private ethereum network to operate in (example: `http://somenetwork.example.org:8540`). Defaults to `mainnet`| 
ethereumTxSpeed |  Additional gas fee that is added to the base gas fee for the given ethereum network to speed up the mining process of the transaction. The usage of `none` value may result in the transaction never gets mined and is only intended to use for custom ethereum networks that employ zero gas price policies. The speed levels correspond with following Ethereum fees (in gwei): `none`: 0, `slow`: 2, `default`: 5, `fast`: 15. Defaults to `default`. |
bitcoinNetwork | Public Bitcoin network name. Supported networks: `bitcoin`, `testnet. Defaults to `bitcoin` |
bitcoinTxConfirmations | Minimum amount of block confirmations required for Bitcoin balance outputs ("utxo", "coins") to be included in the total wallet balance calculation. The exclusion of unconfirmed outputs prevents the posthumous invalidation of own wallet transaction by the parent utxo sending party. The levels correspond with following target block confirmations amount (# of confirmations): `none`: 0, `default`: 1, `secure`: 6. Defaults to `default`. |
bitcoinTxSpeed | Defines the target amount of blocks for the transaction to be included to the Bitcoin network. Faster inclusion requires a higher transaction fee. The fee is calculated in real time based on the network state and can be limited by the `header-bitcoin-max-fee-rate` option. The effective transaction delay can be calculated by multiplying the target confirmation blocks with the Bitcoin block time of 10 minutes (e.g. `slow` yields an block inclusion time of approx. 4h). The speed levels correspond with following block times (target blocks): `slow`: 24, `default`: 6, `fast`: 2.  Defaults to `default` |
bitcoinMaxFeeRate | Defines the maximum allowed fee rate in satoshi per byte for a Bitcoin transaction. Prevents from speding absurdly high transaction fees during block fee peaks |


###  More examples
For more examples check out the tests (e.g. [./test/*.e2e.js](./test/ethereum.e2e.js))

#### Wallet interface
https://tangany.docs.stoplight.io/api/wallet/

````javascript

(async () => {
    const api = new WaasApi(options);
    // list all wallets
    const { list } = (await api.wallet().list()).data;
    //  create a new wallet
    const { wallet, security } = (await api.wallet().create("some-random-wallet-name", false)).data;
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
    const api = new WaasApi(options);
    // get transaction status
    const { blockNr, isError } = (await api.eth("0x8a72609aaa14c4ff4bd44bd75848c27efcc36b3341d170000000000000000000").get()).data;
    // wait for transaction is mined
    await api.eth("0x8a72609aaa14c4ff4bd44bd75848c27efcc36b3341d170000000000000000000").wait();
})();
````

#### Ethereum interface for wallet
https://tangany.docs.stoplight.io/api/ethereum/

````javascript
(async () => {
    const api = new WaasApi(options).wallet("some-wallet-name");
    // send ether
    const { hash } = (await api.eth().send("0xcbbe0c0454f3379ea8b0f0000000000000000000", "0.043")).data;
    // get eth balance and wallet address
    const { currency, balance, address } = (await api.eth().get()).data;
})();
````

#### Ethereum erc20 token interface for wallet
https://tangany.docs.stoplight.io/api/ethereum-erc20

````javascript
(async () => {
    const api = new WaasApi(options).wallet("func-spec").eth().erc20("0xc32ae45504ee9482db99cfa21066a59e877bc0e6");
    // send token
    const { hash } = (await api.send("0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1", "0.043")).data;
    // get token balance
    const { currency, balance, address } = (await api.get()).data;
})();
````

## Debugging
To log the axios HTTP requests, add the following environment variable
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
