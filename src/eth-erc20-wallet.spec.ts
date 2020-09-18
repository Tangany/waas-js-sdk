import {sandbox} from "./utils/spec-helpers";
import * as assert from "assert";
import {EthErc20Wallet} from "./eth-erc20-wallet";
import {Waas} from "./waas";
import {Wallet} from "./wallet";

sandbox();

describe("EthErc20Wallet", function() {

    const sampleToken = "0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1";
    const sampleAddress = "0xba16bA898b12530337A36B5257DD4ec74069ebF1";
    const sampleWallet = "my-wallet";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.spy = this.waas.wrap = this.sandbox.spy();
        this.walletInstance = new Wallet(this.waas, sampleWallet);
    });

    it("should construct an instance", function() {
        assert.ok(new EthErc20Wallet(this.stub, this.walletInstance, sampleToken));
    });

    it("should throw for invalid address", function() {
        assert.throws(() => new EthErc20Wallet(this.waas, this.walletInstance, undefined as any));
        assert.throws(() => new EthErc20Wallet(this.waas, this.walletInstance, 123 as any));
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            await new EthErc20Wallet(this.waas, this.walletInstance, sampleToken).get();
            assert.strictEqual(this.spy.callCount, 1);
        });
    });

    describe("send", function() {
        it("should execute the call", async function() {
            const r = new EthErc20Wallet(this.waas, this.walletInstance, sampleToken);
            await r.send({to: sampleAddress, amount: "23.010298"});
            assert.strictEqual(this.spy.callCount, 1);
        });
    });

    describe("approve", function() {
        it("should execute the call", async function() {
            const r = new EthErc20Wallet(this.waas, this.walletInstance, sampleToken);
            await r.approve({to: sampleAddress, amount: "23.010298"});
            await r.approve({to: sampleAddress, amount: "1"});
            assert.strictEqual(this.spy.callCount, 2);
        });
    });

    describe("transferFrom", function() {
        it("should execute the call", async function() {
            const r = new EthErc20Wallet(this.waas, this.walletInstance, sampleToken);
            await r.transferFrom({from: sampleAddress, amount: "23.010298"});
            assert.strictEqual(this.spy.callCount, 1);
        });
    });

    describe("burn", function() {
        it("should execute the call", async function() {
            const r = new EthErc20Wallet(this.waas, this.walletInstance, sampleToken);
            await r.burn({amount: "1"});
            assert.strictEqual(this.spy.callCount, 1);
        });
    });
    describe("mint", function() {
        it("should execute the call", async function() {
            const r = new EthErc20Wallet(this.waas, this.walletInstance, sampleToken);
            await r.mint({amount: "18"});
            assert.strictEqual(this.spy.callCount, 1);
        });
    });

    describe("getRecipientsData", function() {
        it("should validate recipients data for given method", function() {
            const r = new EthErc20Wallet(this.waas, this.walletInstance, sampleToken);
            assert.doesNotThrow(() => r.__test_getRecipientsData()({to: sampleAddress, amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("transfer")({to: sampleAddress, amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("transfer")({wallet: "my-wallet", amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("approve")({to: sampleAddress, amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("approve")({wallet: "my-wallet", amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("transferFrom")({from: sampleAddress, amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("transferFrom")({wallet: "my-wallet", amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("burn")({amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("mint")({amount: "6"}));
            assert.doesNotThrow(() => r.__test_getRecipientsData("mint")({wallet: "my-wallet", amount: "6"}));
        });
        it("should throw for invalid recipients data for given method", function() {
            const r = new EthErc20Wallet(this.waas, this.walletInstance, sampleToken);
            assert.throws(() => r.__test_getRecipientsData()({to: sampleAddress, amount: 6 as any}));
            assert.throws(() => r.__test_getRecipientsData()({to: sampleAddress} as any));
            assert.throws(() => r.__test_getRecipientsData()({wallet: 123, amount: "6"} as any), /Expected property "wallet" of type/);
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
            assert.throws(
                () => r.__test_getRecipientsData("approve")({amount: "6"}),
                /At least one of the properties .* must be set/
            );
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
            assert.throws(
                () => r.__test_getRecipientsData("transferFrom")({amount: "6"}),
                /At least one of the properties .* must be set/
            );
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
