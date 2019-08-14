import {sandbox} from "./helpers";
import axios from "axios";
import * as assert from "assert";
import {Waas} from "./waas";
import {EthWallet} from "./eth-wallet";
import {Wallet} from "./wallet";

describe("EthWallet", function() {
    sandbox();

    const auth = {
        clientId: "1",
        clientSecret: "2",
        subscription: "3",
    };

    const sampleWallet = "sample-wallet";
    const sampleAddress = "0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1";
    const wallet = new Wallet(axios, sampleWallet);

    beforeEach(function() {
        this.stub = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        const ethErc20 = new EthWallet(this.stub, this.sandbox.createStubInstance(Wallet));
        assert.ok(ethErc20);
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const stub = this.sandbox.stub(axios, "get");
            await new EthWallet(axios, wallet).get();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("send", function() {
        it("should throw for invalid recipients", async function() {
            const e = new EthWallet(axios, wallet);
            await assert.rejects(async () => e.send({to: sampleAddress, from: "abc"} as any));
            await assert.rejects(async () => e.send({to: sampleAddress} as any));
            await assert.rejects(async () => e.send({to: NaN, amount: "NaN"} as any));
            await assert.rejects(async () => e.send({to: true, amount: true} as any));
        });

        it("should execute the call", async function() {
            const stub = this.sandbox.stub(axios, "post");
            const r = new EthWallet(axios, wallet);
            await r.send({to: sampleAddress, amount: "0.1"});
            assert.strictEqual(stub.callCount, 1);
        });

    });

    describe("erc20", function() {
        it("should return an EthErc20Token instance", async function() {
            this.stub.restore();
            const w = new Waas(auth);
            assert.ok(w.wallet(sampleWallet).eth().erc20("0xB8c77482e45F1F44dE1745F52C74426C631bDD52"));
        });
    });
});
