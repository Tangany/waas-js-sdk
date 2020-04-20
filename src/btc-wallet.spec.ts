import axios from "axios";
import {BtcWallet} from "./btc-wallet";
import * as assert from "assert";
import {sandbox} from "./spec-helpers";
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

    describe("estimateFee", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.post = this.sandbox.spy();
            await new BtcWallet(this.waas, new Wallet(this.waas, sampleWallet)).estimateFee(recipient);
            assert.strictEqual(spy.callCount, 1);
        });
    });

    describe("getRecipientsData", function() {

        it("should construct the expected object for a single recipient", function() {
            const b = new BtcWallet(this.stub, new Wallet(this.stub));
            assert.deepStrictEqual(b.__test_getRecipientsData(recipient), recipient);
        });
        it("should construct the expected object for multiple recipients", function() {
            const b = new BtcWallet(this.stub, new Wallet(this.stub));
            const conf2 = {to: "1bxcc0", amount: "4"};
            assert.deepStrictEqual(b.__test_getRecipientsData([recipient, conf2]), {list: [recipient, conf2]});
        });
        it("should throw for invalid type", function() {
            const b = new BtcWallet(this.stub, new Wallet(this.stub));
            assert.throws(() => b.__test_getRecipientsData({to}), /Missing/);
            assert.throws(() => b.__test_getRecipientsData([recipient, {amount}]), /Missing/);
        });
    });
});
