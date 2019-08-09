import * as moxios from "moxios";
import * as assert from "assert";
import {ConflictError, GeneralError} from "./errors";
import {Wallet} from "./wallet";
import {sandbox} from "./helpers";
import axios from "axios";

sandbox();

describe("Wallet", function() {

    beforeEach(function() {
        this.stub = this.sandbox.stub(axios, "create");
    });

    const dummyWalletName = "ae5de2d7-6314-463e-a470-0a47812fcbec";

    it("should construct an instance", function() {
        assert.ok(new Wallet(axios));
        assert.ok(new Wallet(axios, "some-name"));
    });

    it("should throw due to an invalid wallet name", function() {
        assert.throws(() => new Wallet(axios, 34 as any));
    });

    describe("Errors", function() {
        beforeEach(function() {
            moxios.install();
        });

        afterEach(function() {
            moxios.uninstall();
        });

        it("should throw a ConflictError for an occupied wallet name", async function() {
            const w = new Wallet(axios);
            moxios.stubRequest(/.*/, {
                status: 409,
                response: {message: "ConflictError"},
            });
            await assert.rejects(async () => w.create(dummyWalletName), ConflictError);
        });

        it("should throw a GeneralError for any other errors", async function() {
            const w = new Wallet(axios);
            moxios.stubRequest(/.*/, {
                status: 418,
            });
            await assert.rejects(async () => w.create(dummyWalletName), GeneralError);
        });
    });

    describe("wallet", function() {
        it("should throw for missing wallet name in the constructor", function() {
            const w = new Wallet(axios);
            assert.throws(() => w.wallet);
        });
    });

    describe("list", function() {
        it("should not throw when called without arguments", async function() {
            const stub = this.sandbox.stub(axios, "get").resolvesArg(0);
            const w = new Wallet(axios);
            await w.list();
            assert.ok(stub.alwaysCalledWithExactly("wallet"));
        });

        it("should verify the skiptoken was passed to the api call", async function() {
            const stub = this.sandbox.stub(axios, "get").resolvesArg(0);
            const w = new Wallet(axios);
            await w.list("123");
            stub.alwaysCalledWithExactly([/wallet?skiptoken=123/]);
        });

        it("should throw on invalid skiptoken", async function() {
            const spy = this.sandbox.spy(axios, "get");
            const w = new Wallet(axios);
            await assert.rejects(async () => w.list(123 as any));
            assert.strictEqual(spy.callCount, 0);
        });
    });

    describe("create", function() {

        it("should not throw for missing parameters", async function() {
            const stub = this.sandbox.stub(axios, "post").resolvesArg(0);
            const w = new Wallet(axios);
            await assert.doesNotReject(async () => w.create());
            await assert.doesNotReject(async () => w.create("some-wallet"));
            assert.strictEqual(stub.callCount, 2);
        });
    });

    describe("delete", function() {
        it("should execute the api call", function() {
            const stub = this.sandbox.stub(axios, "delete");
            new Wallet(axios, dummyWalletName).delete();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("get", function() {
        it("should execute the api call", function() {
            const stub = this.sandbox.stub(axios, "get");
            new Wallet(axios, dummyWalletName).get();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("eth", function() {
        it("should return an EthWallet instance", async function() {
            const w = new Wallet(axios, dummyWalletName);
            assert.strictEqual(w.eth().wallet, dummyWalletName);
        });
    });

    describe("btc", function() {
        it("should return an BtcWallet instance", async function() {
            const w = new Wallet(axios, dummyWalletName);
            assert.strictEqual(w.btc().wallet, dummyWalletName);
        });
    });
});
