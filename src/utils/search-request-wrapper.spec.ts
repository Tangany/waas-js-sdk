import * as assert from "assert";
import axios from "axios";
import {ISearchResponse} from "../interfaces/common";
import {ITransactionSearchResponse} from "../interfaces/ethereum";
import {composeEventArgumentQuery, wrapSearchRequestIterable} from "./search-request-wrapper";
import {sandbox} from "./spec-helpers";
import {Waas} from "../waas";

describe("SearchRequestWrapper", function() {

    sandbox();

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    describe("wrapSearchRequestIterable", function() {

        it("should throw for URLS with searchparams", async function() {
            assert.throws(() => wrapSearchRequestIterable<any, any>(this.waas, "foo/bar?some"));
            assert.throws(() => wrapSearchRequestIterable<any, any>(this.waas, "foo/bar?some=&any"));
        })

        it("should be able to iterate in a for await of loop", async function() {

            const sampleResponse: any = (i: number) => ({
                hits: {total: 1},
                list: [
                    {
                        hash: i.toString(),
                        links: [{
                            type: "GET",
                            href: "/eth/transaction/foo",
                            rel: "transaction"
                        }]
                    },
                ],
                links: {next: "/eth/transactions", previous: null}
            });
            const sampleDetailResponse = {foo: "baz", details: []};

            const stub = this.sandbox.stub();
            const txStub = stub.withArgs("/eth/transaction/foo").resolves(sampleDetailResponse);
            const txsStub = stub.withArgs("/eth/transactions");
            txsStub.onFirstCall().resolves(sampleResponse(1)); // initial call
            txsStub.onSecondCall().resolves(sampleResponse(2)); // second call
            txsStub.onThirdCall(3).resolves({...sampleResponse(5), links: {next: null}}); // third call without next link
            this.waas.instance.get = stub;

            const iterable = wrapSearchRequestIterable<any, any>(this.waas, "/eth/transactions");

            for await (const i of iterable) {
                await i.list[0].get();
            }

            assert.strictEqual(txStub.callCount, 3);
            assert.strictEqual(txsStub.callCount, 3);
        })

        it("should provide a method to query the details for each search result item", async function() {
            const sampleResponse: ISearchResponse = {
                hits: {total: 4},
                list: [
                    {links: [{type: "GET", href: "/eth/transaction/1", rel: "transaction"}]},
                    {links: [{type: "GET", href: "/eth/transaction/3", rel: "transaction"}]},
                    {links: [{type: "GET", href: "/eth/transaction/7", rel: "transaction"}]},
                ],
                links: {next: null, previous: null}
            };
            const sampleDetailResponse = {foo: "baz", details: []};

            const stub = this.sandbox.stub();
            stub.onFirstCall().resolves(sampleResponse);
            stub.withArgs("/eth/transaction/1").resolves(sampleDetailResponse);
            this.waas.instance.get = stub;

            const iterable = wrapSearchRequestIterable<any, any>(this.waas, "foo/bar");
            const next = await iterable[Symbol.asyncIterator]().next()
            const result = next.value; // fetch the first result page

            if (!result) {
                assert.fail("Could not fetch results");
            }

            assert.strictEqual(result.list.length, sampleResponse.list.length);
            assert.ok(result.list.every((elem: any) => elem.hasOwnProperty("get")));
            // Test the call of one method exemplary, since all are created iteratively in the same way.
            const details = await result.list[0].get();
            assert.deepStrictEqual(details, sampleDetailResponse);
        });

        it("should provide a method for the next page", async function() {
            const firstResponse: ISearchResponse = {
                hits: {total: 4},
                // Normally this would contain elements, but that doesn't matter for this test case
                list: [],
                links: {
                    next: "/eth/transaction/0x8fc74556a8c0be3773ecaa88b6a4d97f80ce67ab0ca3cd9e3c120136f37b3234/event/2",
                    previous: null
                }
            };
            const secondResponse: ISearchResponse = {
                ...firstResponse,
                links: {
                    next: null,
                    previous: null
                }
            };
            const stub = this.sandbox.stub().onFirstCall().resolves(firstResponse).onSecondCall().resolves(secondResponse);
            this.waas.instance.get = stub;

            const iterable = wrapSearchRequestIterable<any, any>(this.waas, "eth/transactions");
            const iterableNext = iterable[Symbol.asyncIterator]();
            await iterableNext.next();
            const nextPage = await iterableNext.next();
            if (!nextPage) {
                assert.fail("The next page should not be null");
            }

            const pageAfterNext = (await iterableNext.next()).value
            assert.strictEqual(pageAfterNext, null);

            assert.ok(stub.calledTwice);
        });

        it("should provide a method for the previous page", async function() {
            const firstResponse: ISearchResponse = {
                hits: {total: 4},
                // Normally this would contain elements, but that doesn't matter for this test case
                list: [],
                links: {
                    next: null,
                    previous: "/eth/transaction/0x8fc74556a8c0be3773ecaa88b6a4d97f80ce67ab0ca3cd9e3c120136f37b3234/event/2"
                }
            };
            const secondResponse: ISearchResponse = {
                ...firstResponse,
                links: {
                    next: null,
                    previous: null
                }
            };
            const stub = this.sandbox.stub()
                .onFirstCall().resolves(firstResponse)
                .onSecondCall().resolves(secondResponse)
            ;

            this.waas.instance.get = stub;

            const iterable = wrapSearchRequestIterable<any, any>(this.waas, "foo/bar");
            const next = iterable[Symbol.asyncIterator]().next;
            const previous = iterable[Symbol.asyncIterator]().previous;

            const result = await next(); // fetch the initial page
            console.log(result);

            const prevPage = (await previous()).value // fetch previous page data without previous link
            if (!prevPage) {
                assert.fail("The previous page should not be null");
            }

            const pageBeforePrevious = (await previous()); // no results
            assert.strictEqual(pageBeforePrevious.value, null);
            assert.ok(pageBeforePrevious.done);

            assert.ok(stub.calledTwice);
        });

        it("should add the additional data (\"non-links\") for each search result item", async function() {
            // Use the transaction response as an example, but this works the same with any other type
            // that contains other data besides the array "links".
            const sampleResponse: ITransactionSearchResponse = {
                hits: {total: 4},
                list: [
                    {
                        hash: "0x531ac2cc55a58171697136a63f2ff63d2a6f44ea0e706dbc3889a8a0b9b6ef6f",
                        links: [{type: "GET", href: "/eth/transaction/1", rel: "transaction"}]
                    },
                    {
                        hash: "0x91be05d8c414c3eb580c21f82f64dab77b6fc385f9afa27e25988ee6e0a54119",
                        links: [{type: "GET", href: "/eth/transaction/3", rel: "transaction"}]
                    },
                ],
                links: {next: null, previous: null}
            };
            this.waas.instance.get = () => Promise.resolve(sampleResponse);

            const iterable = await wrapSearchRequestIterable<any, { hash: string }>(this.waas, "foo/bar");
            const next = await iterable[Symbol.asyncIterator]().next();
            const result = next.value; // fetch the first result page
            assert.ok(result.list.every(item => "hash" in item));
            assert.strictEqual(result.list[0].hash, sampleResponse.list[0].hash);
            assert.strictEqual(result.list[1].hash, sampleResponse.list[1].hash);
        });

        it("should not throw an error if there is no next or previous page", async function() {
            const sampleResponse: ISearchResponse = {
                hits: {total: 4},
                // Normally this would contain elements, but that doesn't matter for this test case
                list: [],
                links: {
                    next: null,
                    previous: null
                }
            };
            const stub = this.sandbox.stub().resolves(sampleResponse);
            this.waas.instance.get = stub;

            const iterable = wrapSearchRequestIterable<any, any>(this.waas, "foo/bar");
            const iterator = iterable[Symbol.asyncIterator]();
            await iterator.next(); // fetch initial page
            const prevPage = (await iterator.previous()).value;

            // Expect the method to return null without throwing an error
            assert.strictEqual(prevPage, null);
            assert.ok(stub.calledOnce);
        });

        it("should throw an error if no GET link for details is provided", async function() {
            const sampleResponse: ISearchResponse = {
                hits: {total: 4},
                list: [
                    {links: [{type: "INVALID" as any, href: "/eth/transaction/1", rel: "transaction"}]},
                ],
                links: {next: null, previous: null}
            };
            this.waas.instance.get = () => Promise.resolve(sampleResponse);
            const iterable = wrapSearchRequestIterable(this.waas, "foo/bar")
            const iterator = iterable[Symbol.asyncIterator]();

            await assert.rejects(iterator.next,
                /URL for a GET request for further information was expected/);
        });

    });

    describe("composeEventArgumentQuery", function() {

        it("should return an empty string for an empty argument array", function() {
            assert.strictEqual(composeEventArgumentQuery([]), "");
        });

        it("should throw an error for a filter item without properties", function() {
            // Since all properties are optional, one can also pass an empty object
            assert.throws(() => composeEventArgumentQuery([{}]), /An argument filter object must define at least one criterion/);
        });

        it("should concatenate filters after the first one with &", function() {
            const result = composeEventArgumentQuery([
                {position: 0, value: "foo"},
                {position: "my-arg", value: "bar"},
                {position: "another-arg", value: true},
            ]);
            assert.strictEqual(result, "?inputs[0]=\"foo\"&inputs[\"my-arg\"]=\"bar\"&inputs[\"another-arg\"]=true");
        });

        it("should generate the brackets even if no position is specified", function() {
            const result = composeEventArgumentQuery([{type: "bool"}]);
            assert.ok(/inputs\[]/.test(result));
        });

        it("should not generate quotes around the numeric position of an argument", function() {
            const result = composeEventArgumentQuery([{position: 2, value: "foo"}]);
            assert.ok(!/inputs\[".*"]/.test(result));
        });

        it("should generate quotes around argument names", function() {
            const result = composeEventArgumentQuery([{position: "my-arg", value: "baz"}]);
            assert.ok(/inputs\["my-arg"]/.test(result));
        });

    });

});
