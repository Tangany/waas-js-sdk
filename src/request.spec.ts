import * as assert from "assert";
import axios from "axios";
import {Request} from "./request";
import {sandbox} from "./spec-helpers";
import {Waas} from "./waas";

describe("Request", function() {
    sandbox();
    const sampleRequestId = "71c4f385a4124239b6c968e47ea95f73";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        assert.ok(new Request(this.waas, sampleRequestId));
    });

    it("should throw due to an invalid request id", function() {
        assert.throws(() => new Request(this.waas, undefined as any), /got undefined/);
        assert.throws(() => new Request(this.waas, 12345 as any), /Expected/);
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            await new Request(this.waas, sampleRequestId).get();
            assert.strictEqual(spy.callCount, 1);
        });
    });
});
