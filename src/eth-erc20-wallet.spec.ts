import {sandbox} from "./helpers";
import axios from "axios";
import * as assert from "assert";
import {EthErc20Wallet} from "./eth-erc20-wallet";
import {Wallet} from "./wallet";

describe("EthErc20Wallet", function() {
    sandbox();

    const sampleToken = "0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1";
    const sampleAddress = "0xba16bA898b12530337A36B5257DD4ec74069ebF1";
    const sampleWallet = "my-wallet";
    const walletInstance = new Wallet(axios, sampleWallet);

    beforeEach(function() {
        this.stub = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        assert.ok(new EthErc20Wallet(this.stub, walletInstance, sampleToken));
    });

    it("should throw for invalid address", function() {
        assert.throws(() => new EthErc20Wallet(axios, walletInstance, undefined as any));
        assert.throws(() => new EthErc20Wallet(axios, walletInstance, 123 as any));
    });

    describe("wallet", function() {
        it("should reject for missing wallet", async function() {
            assert.throws(() => new EthErc20Wallet(axios, walletInstance, undefined as any).wallet);
        });
        it("should reject for invalid wallet", async function() {
            assert.throws(() => new EthErc20Wallet(axios, walletInstance, console.log.bind(this) as any).wallet);
        });
        it("should return the wallet", async function() {
            assert.strictEqual(new EthErc20Wallet(axios, walletInstance, sampleWallet).wallet, sampleWallet);
        });
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const stub = this.sandbox.stub(axios, "get");
            await new EthErc20Wallet(axios, walletInstance, sampleToken).get();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("send", function() {
        it("should execute the call", async function() {
            const stub = this.sandbox.stub(axios, "post");
            const r = new EthErc20Wallet(axios, walletInstance, sampleToken);
            await r.send(sampleAddress, "23.010298");
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("approve", function() {
        it("should execute the call", async function() {
            const stub = this.sandbox.stub(axios, "post");
            const r = new EthErc20Wallet(axios, walletInstance, sampleToken);
            await r.approve(sampleAddress, "23.010298");
            await r.approve(sampleAddress, "1");
            assert.strictEqual(stub.callCount, 2);
        });
    });

    describe("transferFrom", function() {
        it("should execute the call", async function() {
            const stub = this.sandbox.stub(axios, "post");
            const r = new EthErc20Wallet(axios, walletInstance, sampleToken);
            await r.transferFrom(sampleAddress, "0.0138");
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("burn", function() {
        it("should execute the call", async function() {
            const stub = this.sandbox.stub(axios, "post");
            const r = new EthErc20Wallet(axios, walletInstance, sampleToken);
            await r.burn("18");
            assert.strictEqual(stub.callCount, 1);
        });
    });
    describe("mint", function() {
        it("should execute the call", async function() {
            const stub = this.sandbox.stub(axios, "post");
            const r = new EthErc20Wallet(axios, walletInstance, sampleToken);
            await r.mint("18");
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("getRecipientsData", function() {
        it("should validate recipients data for given method", function() {
            const r = new EthErc20Wallet(axios, walletInstance, sampleToken);
            assert.doesNotThrow(() => r.__test_getRecipientsData()({to: sampleAddress, amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("transfer")({to: sampleAddress, amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("approve")({to: sampleAddress, amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("transferFrom")({from: sampleAddress, amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("burn")({amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("mint")({amount: "6"}));
        });
        it("should throw fo invalid recipients data for given method", function() {
            const r = new EthErc20Wallet(axios, walletInstance, sampleToken);
            assert.throws(() => r.__test_getRecipientsData()({to: sampleAddress, amount: 6 as any}));
            assert.throws(() => r.__test_getRecipientsData()({to: sampleAddress} as any));
            assert.throws(() => r.__test_getRecipientsData("transfer")({from: sampleAddress, amount: "6"}));
            assert.throws(() => r.__test_getRecipientsData("transfer")({
                from: sampleAddress,
                amount: "6",
                someProp: "yeah",
            } as any));
            assert.throws(() => r.__test_getRecipientsData("approve")({to: "", amount: "6"}));
            assert.throws(() => r.__test_getRecipientsData("approve")({
                to: sampleAddress,
                from: sampleAddress,
                amount: "6",
            }));
            assert.throws(() => r.__test_getRecipientsData("transferFrom")({to: sampleAddress, amount: "6"}));
            assert.throws(() => r.__test_getRecipientsData("transferFrom")({
                from: sampleAddress,
                amount: Symbol as any,
            }));
            assert.throws(() => r.__test_getRecipientsData("transferFrom")({from: sampleAddress} as any));
            assert.throws(() => r.__test_getRecipientsData("transferFrom")({
                from: sampleAddress,
                to: sampleAddress,
                amount: "11",
            } as any));
            assert.throws(() => r.__test_getRecipientsData("burn")({amount: 6 as any}));
            assert.throws(() => r.__test_getRecipientsData("burn")({amount: "6", from: "123"} as any));
            assert.throws(() => r.__test_getRecipientsData("burn")({from: "123"} as any));
            assert.throws(() => r.__test_getRecipientsData("burn")({
                to: "123",
                from: sampleAddress,
                amount: "1",
            } as any));
            assert.throws(() => r.__test_getRecipientsData("mint")({amount: "1", to: Error as any}));
            assert.throws(() => r.__test_getRecipientsData("mint")({amount: "1", from: "123"}));
            assert.throws(() => r.__test_getRecipientsData("mint")({} as any));
        });
    });
});
