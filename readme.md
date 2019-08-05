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
            vaultUrl: "https://my-vault-url.net",
            ethereumNetwork: MAINNET
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

option | description | mandatory
--- | --- | ---
clientId | Service to service authentication client ID | ✔
clientSecret | Service to service authentication client secret | ✔
subscription | Product subscription key | ✔
vaultUrl | Tangany vault url | 
ethereumNetwork | Public Ethereum network to operate in or private Ethereum network Custom RPC URL for a private ethereum network to operate in. Example: `http://somenetwork.example.org:8540` | 
ethereumTxSpeed |  Additional gas fee that is added to the base gas fee for the given ethereum network to speed up the mining process of the transaction. The usage of `none` value may result in the transaction never gets mined and is only intended to use for custom ethereum networks that employ zero gas price policies. The speed levels correspond with following Ethereum fees (in gwei): `none`: 0, `slow`: 2, `default`: 5, `fast`: 15. Defaults to `default`. |


###  Examples
For more examples check the tests files (e.g. [./test/e2e.spec.ts](./test/e2e.spec.ts))

#### wallet interface
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

#### general Ethereum interface
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

## Full API documentation
Available at https://tangany.docs.stoplight.io/

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
