import * as assert from "assert";
import axios from "axios";
import {SinonFakeTimers} from "sinon"
import {TimeoutError} from "./errors"
import {IAsyncEthereumTransactionOutput, IAsyncRequestStatus} from "./interfaces"
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

    // The underlying method for polling is also tested separately anyway.
    describe("wait", function() {

        it("should resolve for a completed request", async function() {
            const r = new Request(this.waas, sampleRequestId);
            const sampleReq: IAsyncRequestStatus<IAsyncEthereumTransactionOutput> = {
                process: "Completed",
                status: {
                    stage: "transaction confirmed",
                },
                output: {
                    hash: "0x9f4eb3fe6da8377f5316b2c2103583e88730d273a318459098867fd8ad417d43",
                    blockNr: 7675874,
                    data: "0xf00ba7",
                    status: "confirmed"
                },
                created: new Date(),
                updated: new Date(),
            }
            this.sandbox.stub(Request.prototype, "get").resolves(sampleReq);
            const completed = await r.wait(100, 3);
            assert.deepStrictEqual(completed, sampleReq);
        });

        it("should timeout for a non-completing asynchronous request", async function() {
            const r = new Request(this.waas, sampleRequestId);
            const sampleReq: IAsyncRequestStatus<IAsyncEthereumTransactionOutput> = {
                process: "Running",
                status: {
                    stage: "awaiting transaction confirmation",
                    hash: "0x9f4eb3fe6da8377f5316b2c2103583e88730d273a318459098867fd8ad417d43"
                },
                output: null,
                created: new Date(),
                updated: new Date(),
            }
            this.sandbox.stub(Request.prototype, "get").resolves(sampleReq);
            const timer: SinonFakeTimers = this.sandbox.useFakeTimers({toFake: ["setTimeout"]}); // fake the timer

            await Promise.all([
                assert.rejects(async () => r.wait(10e3), TimeoutError),
                timer.tick(10e3)
            ])
        });

        it("should should reject if the request terminates with error", async function() {
            const r = new Request(this.waas, sampleRequestId);
            this.sandbox.stub(Request.prototype, "get").rejects(new Error("Request could not be completed"));
            await assert.rejects(async () => r.wait(100, 3), /Request could not be completed/);
        });

    });
});
