import * as assert from "assert";
import axios from "axios"
import {EthContractWallet} from "./eth-contract-wallet";
import {IContractTransaction, IEthereumTransactionEstimation} from "./interfaces"
import {sandbox} from "./utils/spec-helpers";
import {Waas} from "./waas";
import {Wallet} from "./wallet";

sandbox();

describe("EthContractWallet", function() {

    const sampleTokenAddress = "0xC32AE45504Ee9482db99CfA21066A59E877Bc0e6";
    const sampleWallet = "my-wallet";
    const sampleContractFunction: IContractTransaction = {
        function: "transfer(address,uint256)",
        inputs: [
            "0xab174eAb6761d6525A8A3a2E065CA042e74D0025",
            "1000000000000000000"
        ]
    }

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.instance = this.sandbox.stub(axios, "create");
        this.waas.wrap = (fn: any) => fn();
        this.walletInstance = new Wallet(this.waas, sampleWallet);
    });

    it("should construct an instance", function() {
        assert.ok(new EthContractWallet(this.waas, this.walletInstance, sampleTokenAddress));
    });

    it("should throw for invalid address", function() {
        assert.throws(() => new EthContractWallet(this.waas, this.walletInstance, undefined as any));
        assert.throws(() => new EthContractWallet(this.waas, this.walletInstance, 123 as any));
    });

    describe("sendAsync", function() {
        it("should execute the call", async function() {
            const sampleRequestId = "71c4f385a4124239b6c968e47ea95f73";
            const postStub = this.waas.instance.post = this.sandbox.stub().resolves({statusUri: `request/${sampleRequestId}`});
            const contractWallet = new EthContractWallet(this.waas, this.walletInstance, sampleTokenAddress);
            const request = await contractWallet.sendAsync(sampleContractFunction);
            assert.strictEqual(postStub.callCount, 1);
            assert.strictEqual(request.id, sampleRequestId);
        });
    });

    describe("estimateFee", function() {
        it("should execute the api call", async function() {
            const sampleEstimation: IEthereumTransactionEstimation = {
                gas: "25028",
                gasPrice: "7786250000",
                fee: "0.000194874265"
            };
            const postStub = this.waas.instance.post = this.sandbox.stub().resolves(sampleEstimation);
            const contractWallet = new EthContractWallet(this.waas, this.walletInstance, sampleTokenAddress);
            const estimation = await contractWallet.estimateFee(sampleContractFunction);
            assert.ok(postStub.calledOnce);
            assert.strictEqual(estimation, sampleEstimation);
        });
    });

});
