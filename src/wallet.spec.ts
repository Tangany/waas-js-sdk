import * as moxios from "moxios";
import * as assert from "assert";
import {ConflictError, GeneralError} from "./errors";
import {ISignatureResponse} from "./interfaces/signature";
import {IWalletSearchResponse} from "./interfaces/wallet"
import {SignatureEncoding} from "./types/common";
import {Waas} from "./waas";
import {Wallet} from "./wallet";
import {sandbox} from "./utils/spec-helpers";
import axios from "axios";

sandbox();

describe("Wallet", function() {
    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    const dummyWalletName = "ae5de2d7-6314-463e-a470-0a47812fcbec";

    it("should construct an instance", function() {
        assert.ok(new Wallet(this.waas));
        assert.ok(new Wallet(this.waas, "some-name"));
    });

    it("should throw due to an invalid wallet name", function() {
        assert.throws(() => new Wallet(this.waas, 34 as any));
    });

    describe("Errors", function() {
        beforeEach(function() {
            moxios.install();

            // The suite's global beforeEach() stubs Axios.create(), which is useful for most tests,
            // but is counterproductive for this one. We don't want to simply stub an error with sinon, but test the real
            // error handling. So we use moxius and stub the response of an Http request only,
            // the rest of the Axios logic (especially the interceptor) is kept from the WaaS class.
            // However, that's only possible if we can create a real Axios object. Therefore we restore the stub here.
            // That's why this line must be placed before instantiating the WaaS object (that's where Axios.create() is called).
            this.waas.instance.restore();
            this.noAuthWaas = new Waas({clientId: "...", clientSecret: "...", subscription: "..."});
        });

        afterEach(function() {
            moxios.uninstall();
        });

        it("should throw a ConflictError for an occupied wallet name", async function() {
            moxios.stubRequest(/.*/, {
                status: 409,
                response: {},
            });
            const w = new Wallet(this.noAuthWaas);
            await assert.rejects(async () => w.create({wallet: dummyWalletName}), ConflictError);
        });

        it("should throw a GeneralError for any other errors", async function() {
            const status = 418;
            const message = "ban earl grey";
            moxios.stubRequest(/.*/, {
                status,
                response: {message},
            });
            const w = new Wallet(this.noAuthWaas);
            await assert.rejects(async () => w.create({wallet: dummyWalletName}), e => {
                assert.ok(e instanceof GeneralError);
                assert.strictEqual(e.status, status)
                assert.strictEqual(e.message, message)
                return true;
            });
        });
    });

    describe("wallet", function() {
        it("should throw for missing wallet name in the constructor", function() {
            const w = new Wallet(this.waas);
            assert.throws(() => w.wallet);
        });
    });

    describe("list", function() {

        const singlePageResponse: IWalletSearchResponse = {
            hits: {total: 0, hsm: 0},
            list: [],
            links: {next: null, previous: null},
        }

        it("should call the deprecated endpoint if no argument is passed", async function() {
            const stub = this.waas.instance.get = this.sandbox.stub().resolvesArg(0);
            await new Wallet(this.waas).list();
            assert.ok(stub.calledOnce);
            assert.ok(stub.firstCall.calledWithExactly("wallet"));
        });

        it("should call the deprecated endpoint with the passed skiptoken", async function() {
            const stub = this.waas.instance.get = this.sandbox.stub().resolvesArg(0);
            await new Wallet(this.waas).list("123");
            assert.ok(stub.calledOnce);
            assert.ok(stub.firstCall.calledWithExactly("wallet?skiptoken=123"));
        });

        it("should call the non-deprecated endpoint if the object parameter overload is used", async function() {
            const stub = this.waas.instance.get = this.sandbox.stub().resolves(singlePageResponse);
            const iterable = new Wallet(this.waas).list({tag: ["my-tag", "test"]});
            await iterable.next();
            assert.ok(stub.calledOnce);
            assert.ok(stub.firstCall.calledWith("wallets"));
        });

        it("should return an asynchronous iterable if the object parameter overload is used", async function() {
            const stub = this.waas.instance.get = this.sandbox.stub().resolves(singlePageResponse);
            const iterable = await new Wallet(this.waas).list({sort: "createddesc"});
            assert.ok(iterable);
            assert.ok(typeof iterable[Symbol.asyncIterator] === "function");
            const page = (await iterable[Symbol.asyncIterator]().next()).value;
            assert.ok(page);
            assert.ok(stub.calledOnce);
        });

        it("should throw on invalid argument", async function() {
            const stub = this.waas.instance.get = this.sandbox.stub().resolves(0);
            const w = new Wallet(this.waas);
            await assert.rejects(async () => w.list(123 as any), /The passed argument for wallet search is invalid/);
            assert.strictEqual(stub.callCount, 0);
        });
    });

    describe("create", function() {
        it("should not throw for missing parameters", async function() {
            const stub = this.waas.instance.post = this.sandbox.stub().resolves();
            const w = new Wallet(this.waas);
            await assert.doesNotReject(async () => w.create());
            await assert.doesNotReject(async () => w.create("some-wallet"));
            assert.strictEqual(stub.callCount, 2);
        });
        it("should throw an error if an invalid method overload is used", async function() {
            const wallet = new Wallet(this.waas);
            await assert.rejects(() => wallet.create("my-wallet", "no hsm" as any), /Expected \?Boolean, got String/)
            await assert.rejects(() => wallet.create(true as any), /The passed arguments does not match a valid method overload/)
            await assert.rejects(() => wallet.create(["abc", "def"] as any), /The passed arguments does not match a valid method overload/)
        });
        it("should convert the tags to the format expected by the API", async function() {
            const spy = this.waas.instance.post = this.sandbox.spy();
            await new Wallet(this.waas, dummyWalletName).create({
                tags: [
                    {name: "test-tag", value: true},
                    {name: "anotherTag", value: "foo"}
                ]
            });
            const expectedTags = [{"test-tag": true}, {"anotherTag": "foo"}];
            assert.deepStrictEqual(spy.firstCall.args[1].tags, expectedTags);
        });
    });

    describe("update", function() {
        it("should throw for invalid argument", async function() {
            const stub = this.waas.instance.patch = this.sandbox.stub().resolves();
            const w = new Wallet(this.waas);
            await assert.rejects(async () => w.update(undefined as any), /Expected Object, got undefined/);
            await assert.rejects(async () => w.update(123 as any), /Expected Object, got Number/);
            assert.ok(stub.notCalled);
        });

        it("should execute the api call", async function() {
            const spy = this.waas.instance.patch = this.sandbox.spy();
            await new Wallet(this.waas, dummyWalletName).update({tags: []});
            assert.strictEqual(spy.callCount, 1);
            assert.ok(spy.firstCall.calledWith(`wallet/${dummyWalletName}`));
        });
        it("should convert the tags to the format expected by the API", async function() {
            const spy = this.waas.instance.patch = this.sandbox.spy();
            await new Wallet(this.waas, dummyWalletName).update({
                tags: [
                    {name: "test-tag", value: true},
                    {name: "anotherTag", value: "foo"}
                ]
            });
            const expectedTags = [{"test-tag": true}, {"anotherTag": "foo"}];
            assert.deepStrictEqual(spy.firstCall.args[1].tags, expectedTags);
        });
    });

    describe("replace", function() {
        it("should not throw for undefined optional parameters", async function() {
            const stub = this.waas.instance.put = this.sandbox.stub().resolves();
            const w = new Wallet(this.waas, dummyWalletName);
            await assert.doesNotReject(async () => w.replace());
            assert.strictEqual(stub.callCount, 1);
        });

        it("should execute the api call", async function() {
            const stub = this.waas.instance.put = this.sandbox.spy();
            await new Wallet(this.waas, dummyWalletName).replace();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("delete", function() {
        it("should execute the api call", async function() {
            const stub = this.waas.instance.delete = this.sandbox.spy();
            await new Wallet(this.waas, dummyWalletName).delete();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const stub = this.waas.instance.get = this.sandbox.spy();
            await new Wallet(this.waas, dummyWalletName).get();
            assert.strictEqual(stub.callCount, 1);
        });
    });

    describe("sign", function() {
        it("should execute the api call", async function() {
            const res: ISignatureResponse = {
                signature: "MEUCIQCxow7KVLW3SbQpMLhlLc6xBIxOHCatXCIutc8Ya7DfVAIgPuGCus2TMO7i9C1nVRKwumTe888UCK2lDR97NGRjftU=",
                encoding: "der"
            }
            const stub = this.waas.instance.post = this.sandbox.stub().resolves(res);
            await new Wallet(this.waas, dummyWalletName).sign("Hello World");
            assert.strictEqual(stub.callCount, 1);

        });
        it("should consider the optional parameter", async function() {
            const res: ISignatureResponse = {
                signature: "DOdiFuYAYrKnYrFg/HP2vDbaOvCz+pNLk8+iE2Zx38o1FKfKpeuwNWpN3BL4lDqajV16Kq+LKqmGImVVt5IILQ==",
                encoding: "ieee-p1363"
            }
            const stub = this.waas.instance.post = this.sandbox.stub().resolves(res);
            const encoding: SignatureEncoding = "ieee-p1363";
            await new Wallet(this.waas, dummyWalletName).sign("Hello World", encoding);
            assert.strictEqual(stub.getCall(0).args[1].encoding, encoding);
        });
    });

    describe("eth", function() {
        it("should return an EthWallet instance", async function() {
            const w = new Wallet(this.waas, dummyWalletName);
            assert.strictEqual(w.eth().wallet, dummyWalletName);
        });
    });

    describe("btc", function() {
        it("should return an BtcWallet instance", async function() {
            const w = new Wallet(this.waas, dummyWalletName);
            assert.strictEqual(w.btc().wallet, dummyWalletName);
        });
    });
});
