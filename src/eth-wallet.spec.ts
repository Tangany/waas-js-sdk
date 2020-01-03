import axios from "axios"
import {EthErc20Wallet} from "./eth-erc20-wallet"
import {sandbox} from "./spec-helpers";
import * as assert from "assert";
import {Waas} from "./waas";
import {EthWallet} from "./eth-wallet";
import {Wallet} from "./wallet";

describe("EthWallet", function() {
    sandbox();
    const sampleWallet = "sample-wallet";
    const sampleAddress = "0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1";

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
        it("should throw for invalid recipients", async function() {
            const e = new EthWallet(this.waas, this.sandbox.createStubInstance(Wallet));
            await assert.rejects(async () => e.send({to: sampleAddress, from: "abc"} as any));
            await assert.rejects(async () => e.send({to: sampleAddress} as any));
            await assert.rejects(async () => e.send({to: NaN, amount: "NaN"} as any));
            await assert.rejects(async () => e.send({to: true, amount: true} as any));
        });

        it("should execute the call", async function() {
            const spy = this.waas.instance.post = this.sandbox.spy();
            const wallet = new Wallet(this.waas, sampleWallet);
            const r = new EthWallet(this.waas, wallet);
            await r.send({to: sampleAddress, amount: "0.1"});
            assert.strictEqual(spy.callCount, 1, "invalid stub.callCount");
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
});
