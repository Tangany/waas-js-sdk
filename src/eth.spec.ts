import * as assert from "assert";
import axios from "axios";
import {MiningError, TimeoutError} from "./errors";
import {isBitcoinMiningErrorData} from "./errors/mining-error";
import {Ethereum} from "./eth";
import {IEthereumTransactionStatus} from "./interfaces";
import {sandbox} from "./spec-helpers";
import {Waas} from "./waas";

sandbox();

describe("Ethereum", function() {
    const nonHash = "0x7777777777777777777777777777777777777777777777777777777777777777";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        assert.ok(new Ethereum(this.waas));
        assert.ok(new Ethereum(this.waas, nonHash));
    });

    it("should throw for invalid hash", function() {
        assert.throws(() => new Ethereum(this.stub, true as any), /Expected/);
    });

    describe("txHash", function() {
        it("should throw for missing hash", async function() {
            assert.throws(() => new Ethereum(this.waas).txHash);
        });
        it("should throw for invalid hash", async function() {
            assert.throws(() => new Ethereum(this.waas, Infinity as any).txHash);
        });
        it("should return the hash", async function() {
            assert.strictEqual(new Ethereum(this.waas, nonHash).txHash, nonHash);
        });
    });

    describe("get", function() {
        it("should throw for missing transaction hash", function(){
            const eth = new Ethereum(this.waas);
            // The method should call the getter (with type check) instead of the instance variable, which may be undefined
            const spy = this.sandbox.spy(eth, "txHash", ["get"]).get;
            assert.throws(() => eth.txHash);
            assert.ok(spy.calledOnce);
        });

        it("should execute the api call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            await new Ethereum(this.waas, nonHash).get();
            assert.strictEqual(spy.callCount, 1);
        });
    });

    describe("wait", function() {
        it("should timeout for non-existent transaction", async function() {
            const e = new Ethereum(this.waas, nonHash);
            // tslint:disable-next-line:no-null-keyword
            this.sandbox.stub(Ethereum.prototype, "get").resolves({isError: false, blockNr: null});

            await assert.rejects(async () => e.wait(5), TimeoutError);
        });
        it("should resolve for a successful transaction", async function() {
            const e = new Ethereum(this.waas, nonHash);
            this.sandbox.stub(Ethereum.prototype, "get").resolves({isError: false, blockNr: 777});

            await assert.doesNotReject(async () => e.wait());
        });
        it("should reject for a unsuccessful transaction", async function() {
            const e = new Ethereum(this.waas, nonHash);
            this.sandbox.stub(Ethereum.prototype, "get").resolves({isError: true, blockNr: undefined});
            await e.wait()
                .then(() => assert.fail("should have failed"))
                .catch((r: MiningError) => {
                    assert.ok(r instanceof MiningError);
                    if (isBitcoinMiningErrorData(r.txData)) {
                        throw new Error("invalid error type");
                    }
                    const txData = (r.txData) as IEthereumTransactionStatus;
                    assert.strictEqual(txData.isError, true);
                    assert.strictEqual(txData.blockNr, undefined);
                });
        });
        it("should throw while the 'get' call", async function() {
            const e = new Ethereum(this.waas, nonHash);
            // tslint:disable-next-line:no-null-keyword
            this.sandbox.stub(Ethereum.prototype, "get").throws(() => new Error("Some error"));
            await assert.rejects(async () => e.wait(), /Some error/);
        });
    });
});
