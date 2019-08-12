import * as assert from "assert";
import axios from "axios";
import {Bitcoin} from "./btc";
import {MiningError, TimeoutError} from "./errors";
import {isBitcoinMiningErrorData} from "./errors/mining-error";
import {Ethereum} from "./eth";
import {sandbox} from "./helpers";

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

    describe("wait", function() {
        it("should timeout for non-existent transaction", async function() {
            const e = new Bitcoin(axios, nonHash);
            // tslint:disable-next-line:no-null-keyword
            this.sandbox.stub(Ethereum.prototype, "get").resolves({
                data: {
                    status: "pending",
                    confirmations: undefined,
                },
            });

            await assert.rejects(async () => e.wait(5), TimeoutError);
        });
        it("should resolve for a successful transaction", async function() {
            const e = new Bitcoin(axios, nonHash);
            this.sandbox.stub(Bitcoin.prototype, "get").resolves({data: {status: "confirmed", confirmations: 213}});

            await assert.doesNotReject(async () => e.wait());
            await assert.strictEqual((await e.wait()).data.confirmations, 213);
        });
        it("should reject for a unsuccessful transaction", async function() {
            const e = new Bitcoin(axios, nonHash);
            this.sandbox.stub(Bitcoin.prototype, "get").resolves({data: {status: "error", confirmations: undefined}});
            await e.wait()
                .then(() => assert.fail("should have failed"))
                .catch((r: MiningError) => {
                    assert.ok(r.txData);
                    if (!isBitcoinMiningErrorData(r.txData)) {
                        throw new Error("invalid type");
                    }
                    assert.strictEqual(r.txData.data.status, "error");
                    assert.strictEqual(r.txData.data.confirmations, undefined);
                });
        });
    });
});
