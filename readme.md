<div align="center">  
  <a href="https://tangany.com">  
    <img src="https://raw.githubusercontent.com/Tangany/cloud-wallet/master/docs/tangany.gif"  alt="Tangany" width="50%" />  
  </a>  
  <h1>Official Javascript SDK for Tangany Wallet as a Service API</h1>      
</div>  

A node.js integration of the [Tangany Wallet as a Service API](https://tangany.com) to be used in a backend scenario.

[![NPM version](https://raw.githubusercontent.com/Tangany/waas-js-sdk/master/docs/package-badge.svg?sanitize=true)](https://www.npmjs.com/package/@tangany/waas-js-sdk)

## Getting started
Install the package
```
npm install @tangany/waas-js-sdk
```

Import the main module
```javascript
const { WaasApi } = require("@tangany/waas-js-sdk");
const dotenv = require("dotenv");

// set the environment variables
dotenv.config();

/**
 * fetch all client wallets
 */
(async () => {
    const api = new WaasApi(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.SUBSCRIPTION);
    let skiptoken = undefined;
    
    async function listWallets () {
        const data = (await api.wallet.listWallets(skiptoken)).data;
        skiptoken = data.skiptoken;
        
        return data;
    }
    
    do {
        // fetch wallets until no skiptoken is returned in the response
        const { list } = await listWallets();
        console.log(list);
    }
    while (!!skiptoken);
    
    /*
    [ { wallet: 'wallet1',
     version: 'latest',
     created: '2019-04-05T10:12:56Z',
     updated: '2019-04-05T10:12:56Z',
     security: 'software' },
    { wallet: 'some-other-wallet',
     version: 'latest',
     created: '2019-04-07T15:02:48Z',
     updated: '2019-04-07T15:02:48Z',
     security: 'software' },
    { wallet: 'dummy-wallet101131',
     version: 'latest',
     created: '2019-04-11T01:02:00Z',
     updated: '2019-04-11T01:02:00Z',
     security: 'hardware' },
      ...
    */
})();
```

###  Examples
For more examples check the tests under `./src/*.spec.ts`

### wallet interface
https://tangany.docs.stoplight.io/api/wallet/

````javascript
(async () => {
    const wlt = new WaasApi(...authdata).wallet;
    // list all wallets
    const {list} = (await wlt.listWallets()).data;
    //  create a new wallet
    const {wallet,security} = (await wlt.createWallet()).data;
    //  fetch a wallet
    const {created} = (await wlt.getWallet(wallet)).data;
    //  delete a wallet
    const {scheduledPurgeDate, recoveryId} = (await wlt.deleteWallet(wallet)).data;
})()
````

### general ethereum interface
*Ethereum calls that are not wallet based*
````javascript
(async () => {
    const eth = new WaasApi(...authdata).ethereum;
    // get transaction status
    const {blockNr, isError} = (await eth.getTxStatus(sampleTx)).data;
    // wait for transaction is mined
    await eth.waitForMined(sampleTx);
})()
````

### ethereum interface for wallet
https://tangany.docs.stoplight.io/api/ethereum/

````javascript
(async () => {
    const ethWlt = new WaasApi(...authdata).wallet.eth("my-wallet-name");
    // send ether
    const {hash} = (await ethWlt.send("0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1","0.043")).data;
    // get balance and wallet address
    const {currency,balance,address}= (await ethWlt.getWalletBalance()).data;
})()
````

### ethereum erc20 token interface for wallet
https://tangany.docs.stoplight.io/api/ethereum-erc20

````javascript
(async () => {
    const ethErc20Wlt = new WaasApi(...authdata).wallet.ethErc20("my-wallet-name","0xB1c77482e45F1F44dE1745F52C74426C631beD50");
    // send token
    const {hash} = (await ethErc20Wlt.sendToken("0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1","0.043")).data;
    // get balance and wallet address
    const {currency,balance,address}= (await ethErc20Wlt.getTokenBalance()).data;
})()
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
