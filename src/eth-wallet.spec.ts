import axios from "axios";
import {EthContractWallet} from "./eth-contract-wallet"
import {EthErc20Wallet} from "./eth-erc20-wallet";
import {sandbox} from "./spec-helpers";
import * as assert from "assert";
import {Waas} from "./waas";
import {EthWallet} from "./eth-wallet";
import {Wallet} from "./wallet";

describe("EthWallet", function() {
    sandbox();
    const sampleWallet = "sample-wallet";
    const sampleAddress = "0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1";
    const sampleAmount = "0.0002";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        const ethErc20 = new EthWallet(this.stub, this.sandbox.createStubInstance(Wallet));
        assert.ok(ethErc20);
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            const wallet = new Wallet(this.waas, sampleWallet);
            const ew = new EthWallet(this.waas, wallet);
            await ew.get();
            assert.strictEqual(spy.callCount, 1);
        });
    });

    describe("send", function() {
        it("should execute the call", async function() {
            const postSpy = this.waas.instance.post = this.sandbox.spy();
            const wallet = new Wallet(this.waas, sampleWallet);
            const r = new EthWallet(this.waas, wallet);
            const validateSpy = this.sandbox.spy(r, "validateRecipient");
            await r.send({to: sampleAddress, amount: "0.1", data: "0xf03"});
            assert.strictEqual(postSpy.callCount, 1);
            assert.strictEqual(validateSpy.callCount, 1);
        });
    });

    describe("sendAsync", function() {
        it("should throw for unexpected API response", async function() {
            this.waas.instance.post = async () => Promise.resolve({anotherProperty: "invalid key and value"});
            const wallet = new Wallet(this.waas, sampleWallet);
            const ethWallet = new EthWallet(this.waas, wallet);
            await assert.rejects(async () => ethWallet.sendAsync({
                to: sampleAddress,
                amount: sampleAmount
            }), /returned an unexpected format/);
        });

        it("should execute the call", async function() {
            const sampleRequestId = "71c4f385a4124239b6c968e47ea95f73";
            const postStub = this.waas.instance.post = this.sandbox.stub().resolves({statusUri: `request/${sampleRequestId}`});
            const wallet = new Wallet(this.waas, sampleWallet);
            const r = new EthWallet(this.waas, wallet);
            const validateSpy = this.sandbox.spy(r, "validateRecipient");
            const request = await r.sendAsync({to: sampleAddress, amount: "0.1", data: "0xf03"});
            assert.strictEqual(validateSpy.callCount, 1);
            assert.strictEqual(postStub.callCount, 1);
            assert.strictEqual(request.id, sampleRequestId);
        });
    });

    describe("erc20", function() {
        it("should return an EthErc20Token instance", async function() {
            const wallet = new Wallet(this.waas, sampleWallet);
            const r = new EthWallet(this.waas, wallet);
            const erc = r.erc20(sampleAddress);
            assert.ok(erc instanceof EthErc20Wallet);
        });
    });

    describe("validateRecipient", function(){
        it("should throw for missing arguments", function() {
            const wallet = new Wallet(this.waas, sampleWallet);
            const ethWallet = new EthWallet(this.waas, wallet);
            assert.throws(
                () => ethWallet.__test_validateRecipient({to: sampleAddress}),
                /Missing 'amount' argument/);
            assert.throws(
                () => ethWallet.__test_validateRecipient({to: NaN, amount: "NaN"}),
                /Missing 'to' argument/);
        });

        it("should throw for invalid types", function() {
            const wallet = new Wallet(this.waas, sampleWallet);
            const ethWallet = new EthWallet(this.waas, wallet);
            assert.throws(
                () => ethWallet.__test_validateRecipient({to: true, amount: true}),
                /Expected property "to" of type String, got Boolean true/);
            assert.throws(
                () => ethWallet.__test_validateRecipient({
                    to: sampleAddress,
                    amount: sampleAmount,
                    data: true}),
                /Expected property "data" of type \?String, got Boolean true/);
            assert.throws(
                () => ethWallet.__test_validateRecipient({
                    to: sampleAddress,
                    amount: sampleAmount,
                    from: "abc",}),
                /Unexpected property "from"/);
        });
    });

    describe("contract", function() {
        it("should return an EthContractWallet instance", function() {
            const wallet = new Wallet(this.waas, sampleWallet);
            const ethWallet = new EthWallet(this.waas, wallet);
            const contractWallet = ethWallet.contract("0xC32AE45504Ee9482db99CfA21066A59E877Bc0e6");
            assert.ok(contractWallet instanceof EthContractWallet);
        });
    });
});
