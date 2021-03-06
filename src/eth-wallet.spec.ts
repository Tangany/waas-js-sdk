import axios from "axios";
import {EthContractWallet} from "./eth-contract-wallet"
import {EthErc20Wallet} from "./eth-erc20-wallet";
import {IEthereumTransactionSentResponse, ITransactionSearchResponse} from "./interfaces/ethereum";
import {EthTransactionIterable} from "./iterables/auto-pagination/eth-transaction-iterable"
import {EthTransactionPageIterable} from "./iterables/pagewise/eth-transaction-page-iterable"
import {sandbox} from "./utils/spec-helpers";
import * as assert from "assert";
import {Waas} from "./waas";
import {EthWallet} from "./eth-wallet";
import {Wallet} from "./wallet";
import {Monitor} from "./monitor";

describe("EthWallet", function() {
    sandbox();
    const sampleWallet = "sample-wallet";
    const sampleAddress = "0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1";
    const sampleAmount = "0.0002";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        const ethErc20 = new EthWallet(this.stub, this.sandbox.createStubInstance(Wallet));
        assert.ok(ethErc20);
    });

    describe("get", function() {
        it("should execute the api call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            const wallet = new Wallet(this.waas, sampleWallet);
            const ew = new EthWallet(this.waas, wallet);
            await ew.get();
            assert.strictEqual(spy.callCount, 1);
        });
    });

    describe("send", function() {
        it("should execute the call", async function() {
            const hash = "0xd7532d29a2f29806e0aaed2eb3987be53ccd8689ec7ce9934532021f5c9708e3";
            const response: IEthereumTransactionSentResponse = {
                hash,
                nonce: "123",
                links: [{type: "GET", rel: "transaction", href: `/eth/transaction/${hash}`}]
            }
            const postStub = this.waas.instance.post = this.sandbox.stub().resolves(response);
            const wallet = new Wallet(this.waas, sampleWallet);
            const r = new EthWallet(this.waas, wallet);
            const validateSpy = this.sandbox.spy(r, "validateRecipient");
            const tx = await r.send({to: sampleAddress, amount: "0.1", data: "0xf03"});
            assert.strictEqual(tx.hash, hash);
            assert.strictEqual(postStub.callCount, 1);
            assert.strictEqual(validateSpy.callCount, 1);
        });
    });

    describe("sendAsync", function() {
        it("should throw for unexpected API response", async function() {
            this.waas.instance.post = async () => Promise.resolve({anotherProperty: "invalid key and value"});
            const wallet = new Wallet(this.waas, sampleWallet);
            const ethWallet = new EthWallet(this.waas, wallet);
            await assert.rejects(async () => ethWallet.sendAsync({
                to: sampleAddress,
                amount: sampleAmount
            }), /returned an unexpected format/);
        });

        it("should execute the call", async function() {
            const sampleRequestId = "71c4f385a4124239b6c968e47ea95f73";
            const postStub = this.waas.instance.post = this.sandbox.stub().resolves({statusUri: `request/${sampleRequestId}`});
            const wallet = new Wallet(this.waas, sampleWallet);
            const r = new EthWallet(this.waas, wallet);
            const validateSpy = this.sandbox.spy(r, "validateRecipient");
            const request = await r.sendAsync({to: sampleAddress, amount: "0.1", data: "0xf03"});
            assert.strictEqual(validateSpy.callCount, 1);
            assert.strictEqual(postStub.callCount, 1);
            assert.strictEqual(request.id, sampleRequestId);
        });
    });

    describe("sign", function() {
        it("should execute the api call", async function() {
            const postSpy = this.waas.instance.post = this.sandbox.stub();
            const wallet = new Wallet(this.waas, sampleWallet);
            const ew = new EthWallet(this.waas, wallet);
            const validateSpy = this.sandbox.spy(ew, "validateRecipient");
            await ew.sign({to: sampleAddress, amount: sampleAmount});
            assert.strictEqual(validateSpy.callCount, 1);
            assert.strictEqual(postSpy.callCount, 1);
        });
    });

    describe("estimateFee", function() {
        it("should execute the api call", async function() {
            const postSpy = this.waas.instance.post = this.sandbox.stub();
            const wallet = new Wallet(this.waas, sampleWallet);
            const ew = new EthWallet(this.waas, wallet);
            const validateSpy = this.sandbox.spy(ew, "validateRecipient");
            await ew.estimateFee({to: sampleAddress, amount: sampleAmount, data: "0x23adq341qasda32131cd"});
            assert.strictEqual(validateSpy.callCount, 1);
            assert.strictEqual(postSpy.callCount, 1);
        });
    });

    describe("getTransactions", function() {

        it("should return a page-wise returning iterable if the autoPagination option is not enabled", function() {
            const ethWallet = new EthWallet(this.waas, new Wallet(this.waas, sampleWallet));
            const iterable1 = ethWallet.getTransactions({});
            assert.ok(iterable1 instanceof EthTransactionPageIterable);
            const iterable2 = ethWallet.getTransactions({}, {});
            assert.ok(iterable2 instanceof EthTransactionPageIterable);
            const iterable3 = ethWallet.getTransactions({}, {autoPagination: false});
            assert.ok(iterable3 instanceof EthTransactionPageIterable);
        });

        it("should return an item-wise returning iterable if the autoPagination option is enabled", function() {
            const ethWallet = new EthWallet(this.waas, new Wallet(this.waas, sampleWallet));
            const iterable = ethWallet.getTransactions({}, {autoPagination: true});
            assert.ok(iterable instanceof EthTransactionIterable);
        });

        it("should execute the api call", async function() {
            const sampleResponse: ITransactionSearchResponse = {
                hits: {total: 4},
                list: [
                    {
                        hash: "0x531ac2cc55a58171697136a63f2ff63d2a6f44ea0e706dbc3889a8a0b9b6ef6f",
                        links: [{type: "GET", href: "/eth/transaction/1", rel: "transaction"}]
                    },
                ],
                links: {next: null, previous: null}
            };
            const stub = this.waas.instance.get = this.sandbox.stub().resolves(sampleResponse);
            const wallet = new Wallet(this.waas, sampleWallet);

            const iterable = new EthWallet(this.waas, wallet).getTransactions();
            await iterable[Symbol.asyncIterator]().next();
            assert.ok(stub.calledOnce);
        });
    });

    describe("erc20", function() {
        it("should return an EthErc20Token instance", async function() {
            const wallet = new Wallet(this.waas, sampleWallet);
            const r = new EthWallet(this.waas, wallet);
            const erc = r.erc20(sampleAddress);
            assert.ok(erc instanceof EthErc20Wallet);
        });
    });

    describe("validateRecipient", function(){

        beforeEach(function(){
            const wallet = new Wallet(this.waas, sampleWallet);
            this.ethWallet = new EthWallet(this.waas, wallet);
        });

        it("should throw for missing arguments", function() {
            assert.throws(
                () => this.ethWallet.__test_validateRecipient({}),
                /At least one of the properties .* must be set/);
            assert.throws(
                () => this.ethWallet.__test_validateRecipient({to: NaN, amount: "NaN"}),
                /At least one of the properties .* must be set/);
        });

        it("should throw for invalid types", function() {
            assert.throws(
                () => this.ethWallet.__test_validateRecipient({wallet: 12345}),
                /Expected property "wallet" of type \?String, got Number 12345/);
            assert.throws(
                () => this.ethWallet.__test_validateRecipient({to: true, amount: true}),
                /Expected property "to" of type \?String, got Boolean true/);
            assert.throws(
                () => this.ethWallet.__test_validateRecipient({
                    to: sampleAddress,
                    amount: sampleAmount,
                    data: true}),
                /Expected property "data" of type \?String, got Boolean true/);
            assert.throws(
                () => this.ethWallet.__test_validateRecipient({
                    to: sampleAddress,
                    amount: sampleAmount,
                    from: "abc",}),
                /Unexpected property "from"/);
        });

        it("should not throw if optional arguments are omitted", function() {
            // Omit "to"
            assert.doesNotThrow(() => this.ethWallet.__test_validateRecipient({
                wallet: sampleWallet,
                amount: sampleAmount
            }));
            // Omit "amount"
            assert.doesNotThrow(() => this.ethWallet.__test_validateRecipient({
                wallet: sampleWallet,
            }));
        });
    });

    describe("contract", function() {
        it("should return an EthContractWallet instance", function() {
            const wallet = new Wallet(this.waas, sampleWallet);
            const ethWallet = new EthWallet(this.waas, wallet);
            const contractWallet = ethWallet.contract("0xC32AE45504Ee9482db99CfA21066A59E877Bc0e6");
            assert.ok(contractWallet instanceof EthContractWallet);
        });
    });

    describe("monitor", function() {
        it("should return a Monitor instance", function() {
            const wallet = new Wallet(this.waas, sampleWallet);
            const ethWallet = new EthWallet(this.waas, wallet);
            const monitor = ethWallet.monitor("any-monitor-id");
            assert.ok(monitor instanceof Monitor);
        });
    });
});
