import * as assert from "assert";
import {SinonFakeTimers} from "sinon"
import {Bitcoin} from "./btc";
import {MiningError, TimeoutError} from "./errors";
import {isBitcoinMiningErrorData} from "./errors/mining-error";
import {sandbox} from "./spec-helpers";
import {Waas} from "./waas";
import axios from "axios";

sandbox();

describe("Bitcoin", function() {

    const nonHash = "0000000000000000000000000000000000000000000000000000000000000000";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        assert.ok(new Bitcoin(this.waas));
        assert.ok(new Bitcoin(this.waas, nonHash));
    });

    it("should throw for invalid hash", function() {
        assert.throws(() => new Bitcoin(this.waas, NaN as any));
    });

    describe("txHash", function() {
        it("should throw for non-existent hash", function() {
            const b = new Bitcoin(this.waas);
            assert.throws(() => b.txHash);
        });

        it("should return the hash from the constructor", function() {
            const b = new Bitcoin(this.waas, nonHash);
            assert.strictEqual(b.txHash, nonHash);
        });
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            await new Bitcoin(this.waas, nonHash).get();
            assert.strictEqual(spy.callCount, 1);
        });
    });

    describe("wait", function() {
        it("should timeout for non-existent transaction", async function() {
            const e = new Bitcoin(this.waas, nonHash);
            // tslint:disable-next-line:no-null-keyword
            this.sandbox.stub(Bitcoin.prototype, "get").resolves({
                status: "pending",
                confirmations: undefined,
            });

            await assert.rejects(async () => e.wait(5), TimeoutError);
        });

        it("should resolve for a successful transaction", async function() {
            const e = new Bitcoin(this.waas, nonHash);
            this.sandbox.stub(Bitcoin.prototype, "get").resolves({status: "confirmed", confirmations: 213});
            const timer: SinonFakeTimers = this.sandbox.useFakeTimers({toFake: ["setInterval"]}); // fake the timer
            let confirmations: number | null = 0;
            await Promise.all([
                assert.doesNotReject(async () => e.wait().then(d => confirmations = d.confirmations)),
                timer.tick(800)
            ])
            assert.strictEqual(confirmations, 213);
        });

        it("should reject for a unsuccessful transaction", async function() {
            const e = new Bitcoin(this.waas, nonHash);
            this.sandbox.stub(Bitcoin.prototype, "get").resolves({status: "error", confirmations: undefined});
            const timer: SinonFakeTimers = this.sandbox.useFakeTimers({toFake: ["setInterval"]}); // fake the timer
            await Promise.all([e.wait()
                .then(() => assert.fail("should have failed"))
                .catch((r: MiningError) => {
                    assert.ok(r.txData);
                    if (!isBitcoinMiningErrorData(r.txData)) {
                        throw new Error("invalid type");
                    }
                    assert.strictEqual(r.txData.status, "error");
                    assert.strictEqual(r.txData.confirmations, undefined);
                })
                , timer.tick(800)
            ])
        });
    });

    describe("getStatus", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            await new Bitcoin(this.waas, nonHash).get();
            assert.strictEqual(spy.callCount, 1);
        });
    });
});
