import axios from "axios";
import {BtcWallet} from "./btc-wallet";
import * as assert from "assert";
import {sandbox} from "./spec-helpers";
import {Wallet} from "./wallet";

sandbox();

describe("BtcWallet", function() {
    const sampleWallet = "my-wallet";
    const to = "1bc0xed";
    const amount = "0.12";
    const recipient = {to, amount};

    beforeEach(function() {
        this.stub = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        assert.ok(new BtcWallet(axios, new Wallet(axios, sampleWallet)));
    });

    describe("wallet", function() {
        it("should throw for missing wallet name", function() {
            assert.throws(() => new BtcWallet(axios, new Wallet(axios)).wallet);
        });

        it("should throw for invalid wallet name", function() {
            assert.throws(() => new BtcWallet(axios, new Wallet(axios, -1.2e3 as any)).wallet);
        });

        it("should return the wallet name", function() {
            assert.strictEqual(new BtcWallet(this.stub, new Wallet(this.stub, sampleWallet)).wallet, sampleWallet);
        });
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const stub = this.sandbox.stub(axios, "get");
            await new BtcWallet(axios, new Wallet(axios, sampleWallet)).get();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("send", function() {
        it("should execute the api call", async function() {
            const stub = this.sandbox.stub(axios, "post");
            await new BtcWallet(axios, new Wallet(axios, sampleWallet)).send([recipient, recipient]);
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("estimateFee", function() {
        it("should execute the api call", async function() {
            const stub = this.sandbox.stub(axios, "post");
            await new BtcWallet(axios, new Wallet(axios, sampleWallet)).estimateFee(recipient);
            assert.strictEqual(stub.callCount, 1);
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
