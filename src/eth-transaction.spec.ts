import * as assert from "assert";
import axios from "axios";
import {EthTransaction} from "./eth-transaction"
import {sandbox} from "./utils/spec-helpers";
import {Waas} from "./waas";

describe("EthTransaction", function() {
    sandbox();

    const hash = "dummy-tx-hash";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        const monitor = new EthTransaction(this.waas, hash);
        assert.ok(monitor instanceof EthTransaction);
    });

    it("should not construct an instance if an argument is invalid", function() {
        assert.throws(() => new EthTransaction(this.waas, true as any), /Expected String, got Boolean/);
        assert.throws(() => new EthTransaction(this.waas, 123 as any), /Expected String, got Number/);
    });

    describe("hash", function() {

        it("should throw an error if the property is not set", function() {
            assert.throws(() => new EthTransaction(this.waas, undefined as any).hash, /Expected String, got undefined/);
        });

        it("should return a string if the property is set", function() {
            const txHash = new EthTransaction(this.waas, hash).hash;
            assert.ok(typeof txHash === "string");
        });
    });

    describe("get", function() {

        it("should execute the API call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            await new EthTransaction(this.waas, hash).get();
            assert.ok(spy.calledOnce);
            assert.ok(spy.firstCall.calledWith(`eth/transaction/${hash}`));
        });

    });

});

