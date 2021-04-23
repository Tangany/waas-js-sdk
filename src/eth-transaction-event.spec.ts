import * as assert from "assert";
import axios from "axios";
import {EthTransactionEvent} from "./eth-transaction-event"
import {sandbox} from "./utils/spec-helpers";
import {Waas} from "./waas";

describe("EthTransactionEvent", function() {
    sandbox();

    const txHash = "dummy-tx-hash";
    const eventIndex = 123;
    const eventName = "dummy-event-name";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        const monitor = new EthTransactionEvent(this.waas, txHash, eventIndex, eventName);
        assert.ok(monitor instanceof EthTransactionEvent);
    });

    it("should not construct an instance if an argument is invalid", function() {
        assert.throws(() => new EthTransactionEvent(this.waas, true as any, eventIndex, eventName), /Expected \?String, got Boolean/);
        assert.throws(() => new EthTransactionEvent(this.waas, txHash, "no" as any, eventName), /Expected \?Number, got String/);
        assert.throws(() => new EthTransactionEvent(this.waas, txHash, eventIndex, [] as any), /Expected \?String, got Array/);

    });

    describe("hash", function() {

        it("should throw an error if the property is not set", function() {
            assert.throws(() => new EthTransactionEvent(this.waas, undefined as any, eventIndex, eventName).hash, /Expected String, got undefined/);
        });

        it("should return a string if the property is set", function() {
            const actualHash = new EthTransactionEvent(this.waas, txHash, eventIndex, eventName).hash;
            assert.ok(typeof actualHash === "string");
        });
    });

    describe("index", function() {

        it("should throw an error if the property is not set", function() {
            assert.throws(() => new EthTransactionEvent(this.waas, txHash, undefined as any, eventName).index, /Expected Number, got undefined/);
        });

        it("should return a number if the property is set", function() {
            const actualIndex = new EthTransactionEvent(this.waas, txHash, eventIndex, eventName).index;
            assert.ok(typeof actualIndex === "number");
        });
    });

    describe("name", function() {

        it("should throw an error if the property is not set", function() {
            assert.throws(() => new EthTransactionEvent(this.waas, txHash, eventIndex, undefined as any).name, /Expected String, got undefined/);
        });

        it("should return a string if the property is set", function() {
            const actualName = new EthTransactionEvent(this.waas, txHash, eventIndex, eventName).name;
            assert.ok(typeof actualName === "string");
        });
    });

    describe("get", function() {

        it("should execute the API call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            await new EthTransactionEvent(this.waas, txHash, eventIndex, eventName).get();
            assert.ok(spy.calledOnce);
            assert.ok(spy.firstCall.calledWith(`eth/transaction/${txHash}/event/${eventIndex}`));
        });

    });

});

