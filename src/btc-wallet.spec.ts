import axios from "axios";
import {BtcWallet} from "./btc-wallet";
import * as assert from "assert";
import {IAsyncEndpointResponse} from "./interfaces/common";
import {sandbox} from "./utils/spec-helpers";
import {Waas} from "./waas";
import {Wallet} from "./wallet";

sandbox();

describe("BtcWallet", function() {
    const sampleWallet = "my-wallet";
    const to = "0xb0x3d";
    const amount = "0.12";
    const recipient = {to, amount};

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        assert.ok(new BtcWallet(this.waas, new Wallet(this.waas, sampleWallet)));
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            await new BtcWallet(this.waas, new Wallet(this.waas, sampleWallet)).get();
            assert.strictEqual(spy.callCount, 1);
        });
    });

    describe("send", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.post = this.sandbox.spy();
            await new BtcWallet(this.waas, new Wallet(this.waas, sampleWallet)).send([recipient, recipient]);
            assert.strictEqual(spy.callCount, 1);
        });
    });

    describe("sendAsync", function() {
        it("should execute the call", async function() {
            const sampleRequestId = "71c4f385a4124239b6c968e47ea95f73";
            const sampleResponse: IAsyncEndpointResponse = {statusUri: `request/${sampleRequestId}`};
            const postStub = this.waas.instance.post = this.sandbox.stub().resolves(sampleResponse);
            const req = await new BtcWallet(this.waas, new Wallet(this.waas, sampleWallet)).sendAsync(recipient);
            assert.ok(postStub.calledOnce);
            assert.strictEqual(req.id, sampleRequestId);
        });
    });

    describe("sign", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.post = this.sandbox.spy();
            await new BtcWallet(this.waas, new Wallet(this.waas, sampleWallet)).sign([recipient, recipient]);
            assert.strictEqual(spy.callCount, 1);
        });
    });

    describe("estimateFee", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.post = this.sandbox.spy();
            await new BtcWallet(this.waas, new Wallet(this.waas, sampleWallet)).estimateFee(recipient);
            assert.strictEqual(spy.callCount, 1);
        });
    });

    describe("sweepAsync", function() {

        it("should execute the call", async function() {
            const sampleRequestId = "71c4f385a4124239b6c968e47ea95f73";
            const sampleResponse: IAsyncEndpointResponse = {statusUri: `request/${sampleRequestId}`};
            const postStub = this.waas.instance.post = this.sandbox.stub().resolves(sampleResponse);
            const req = await new BtcWallet(this.waas, new Wallet(this.waas, sampleWallet)).sweepAsync({wallet: "my-wallet"});
            assert.ok(postStub.calledOnce);
            assert.strictEqual(req.id, sampleRequestId);
        });

    });

    describe("getRecipientsData", function() {

        it("should construct the expected object for a single recipient", function() {
            const b = new BtcWallet(this.stub, new Wallet(this.stub, "some-wallet"), );
            assert.deepStrictEqual(b.__test_getRecipientsData(recipient), recipient);
        });
        it("should construct the expected object for multiple recipients", function() {
            const b = new BtcWallet(this.stub, new Wallet(this.stub, "some-wallet"));
            const conf2 = {to: "1bxcc0", amount: "4"};
            assert.deepStrictEqual(b.__test_getRecipientsData([recipient, conf2]), {list: [recipient, conf2]});
        });
        it("should throw for invalid type", function() {
            const b = new BtcWallet(this.stub, new Wallet(this.stub, "some-wallet"));
            assert.throws(() => b.__test_getRecipientsData({amount: "6"}), /At least one of the properties .* must be set/);
            assert.throws(() => b.__test_getRecipientsData({wallet: "my-wallet"}), /Missing 'amount'/);
            assert.throws(() => b.__test_getRecipientsData([recipient, {amount}]), /At least one of the properties .* must be set/);
        });
    });
});
