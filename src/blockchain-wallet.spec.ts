import * as assert from "assert";
import {BlockchainWallet} from "./blockchain-wallet";
import {sandbox} from "./spec-helpers";
import {Waas} from "./waas";
import {Wallet} from "./wallet";

// Extend the abstract class to enable unit testing
class TestingWallet extends BlockchainWallet {
}

sandbox();

describe("BlockchainWallet", function() {

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
    });

    it("should be able to be extended by a class", function() {
        const walletInstance = this.sandbox.createStubInstance(Wallet);
        assert.ok(new TestingWallet(this.waas, walletInstance));
    });

    describe("wallet", function() {
        it("should throw for missing wallet name", function() {
            assert.throws(
                () => new TestingWallet(this.waas, new Wallet(this.waas)).wallet,
                /Expected String, got undefined/);
        });

        it("should throw for invalid wallet name", function() {
            assert.throws(
                () => new TestingWallet(this.waas, new Wallet(this.waas, -1.2e3 as any)).wallet,
                /Expected \?String, got Number/);
        });

        it("should return the wallet name", function() {
            const sampleWallet = "my-wallet";
            const {wallet} = new TestingWallet(this.waas, new Wallet(this.waas, sampleWallet));
            assert.strictEqual(wallet, sampleWallet);
        });
    });
});
