import * as assert from "assert";
import axios from "axios";
import {MiningError, TimeoutError} from "./errors";
import {isBitcoinMiningErrorData} from "./errors/mining-error";
import {Ethereum} from "./eth";
import {sandbox} from "./spec-helpers";

sandbox();

describe("Ethereum", function() {
    const nonHash = "0x7777777777777777777777777777777777777777777777777777777777777777";

    beforeEach(function() {
        this.stub = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        assert.ok(new Ethereum(axios));
        assert.ok(new Ethereum(axios, nonHash));
    });

    it("should throw for invalid hash", function() {
        assert.throws(() => new Ethereum(this.stub, true as any), /Expected/);
    });

    describe("txHash", function() {
        it("should throw for missing hash", async function() {
            assert.throws(() => new Ethereum(axios).txHash);
        });
        it("should throw for invalid hash", async function() {
            assert.throws(() => new Ethereum(axios, Infinity as any).txHash);
        });
        it("should return the hash", async function() {
            assert.strictEqual(new Ethereum(axios, nonHash).txHash, nonHash);
        });
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const stub = this.sandbox.stub(axios, "get");
            await new Ethereum(axios, nonHash).get();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("send", function() {
        it("should execute the api call", async function() {
            const stub = this.sandbox.stub(axios, "get");
            await new Ethereum(axios, nonHash).get();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("wait", function() {
        it("should timeout for non-existent transaction", async function() {
            const e = new Ethereum(axios, nonHash);
            // tslint:disable-next-line:no-null-keyword
            this.sandbox.stub(Ethereum.prototype, "get").resolves({data: {isError: false, blockNr: null}});

            await assert.rejects(async () => e.wait(5), TimeoutError);
        });
        it("should resolve for a successful transaction", async function() {
            const e = new Ethereum(axios, nonHash);
            this.sandbox.stub(Ethereum.prototype, "get").resolves({data: {isError: false, blockNr: 777}});

            await assert.doesNotReject(async () => e.wait());
        });
        it("should reject for a unsuccessful transaction", async function() {
            const e = new Ethereum(axios, nonHash);
            this.sandbox.stub(Ethereum.prototype, "get").resolves({data: {isError: true, blockNr: undefined}});
            await e.wait()
                .then(() => assert.fail("should have failed"))
                .catch((r: MiningError) => {
                    assert.ok(r instanceof MiningError);
                    if (isBitcoinMiningErrorData(r.txData)) {
                        throw  new Error("invalid error type");
                    }
                    assert.strictEqual(r.txData.data.isError, true);
                    assert.strictEqual(r.txData.data.blockNr, undefined);
                });
        });
        it("should throw while the 'get' call", async function() {
            const e = new Ethereum(axios, nonHash);
            // tslint:disable-next-line:no-null-keyword
            this.sandbox.stub(Ethereum.prototype, "get").throws(() => new Error("Some error"));
            await assert.rejects(async () => e.wait(), /Some error/);
        });
    });
});
