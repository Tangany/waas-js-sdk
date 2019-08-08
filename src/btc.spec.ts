import axios from "axios";
import {Bitcoin} from "./btc";
import {sandbox} from "./helpers";
import * as assert from "assert";

sandbox();
const nonHash = "0000000000000000000000000000000000000000000000000000000000000000";

describe("Bitcoin", function() {

    beforeEach(function() {
        this.stub = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        assert.ok(new Bitcoin(axios));
        assert.ok(new Bitcoin(axios, nonHash));
    });

    it("should throw for invalid hash", function() {
        assert.throws(() => new Bitcoin(axios, NaN as any));
    });

    describe("txHash", function() {
        it("should throw for non-existent hash", function() {
            const b = new Bitcoin(axios);
            assert.throws(() => b.txHash);
        });

        it("should return the hash from the constructor", function() {
            const b = new Bitcoin(axios, nonHash);
            assert.strictEqual(b.txHash, nonHash);
        });
    });

    describe("get", function() {
        it("should execute the api call", function() {
            const stub = this.sandbox.stub(axios, "get");
            new Bitcoin(axios, nonHash).get();
            assert.strictEqual(stub.callCount, 1);
        });
    });
});
