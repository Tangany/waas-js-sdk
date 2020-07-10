import * as assert from "assert";
import axios from "axios";
import {ISearchResponse, ISearchTxResponse} from "./interfaces";
import {wrapSearchRequest} from "./search-request-wrapper";
import {sandbox} from "./spec-helpers";
import {Waas} from "./waas";

describe("SearchRequestWrapper", function() {

    sandbox();

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

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

        const result = await wrapSearchRequest<any, any>(this.waas, "foo/bar");
        assert.strictEqual(result.list.length, sampleResponse.list.length);
        assert.ok(result.list.every(elem => elem.hasOwnProperty("get")));
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

        const result = await wrapSearchRequest<any, any>(this.waas, "foo/bar");
        const nextPage = await result.next();
        if (!nextPage) {
            assert.fail("The next page should not be null");
        }

        const pageAfterNext = await nextPage.next();
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
        const stub = this.sandbox.stub().onFirstCall().resolves(firstResponse).onSecondCall().resolves(secondResponse);
        this.waas.instance.get = stub;

        const result = await wrapSearchRequest<any, any>(this.waas, "foo/bar");
        const prevPage = await result.previous();
        if (!prevPage) {
            assert.fail("The previous page should not be null");
        }

        const pageBeforePrevious = await prevPage.next();
        assert.strictEqual(pageBeforePrevious, null);

        assert.ok(stub.calledTwice);
    });

    it("should add the additional data (\"non-links\") for each search result item", async function() {
        // Use the transaction response as an example, but this works the same with any other type
        // that contains other data besides the array "links".
        const sampleResponse: ISearchTxResponse = {
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

        const result = await wrapSearchRequest<any, { hash: string }>(this.waas, "foo/bar");
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

        const result = await wrapSearchRequest<any, any>(this.waas, "foo/bar");
        const nextPage = await result.next();
        const prevPage = await result.previous();

        // Expect the method to return null without throwing an error
        assert.strictEqual(nextPage, null);
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
        await assert.rejects(
            () => wrapSearchRequest(this.waas, "foo/bar"),
            /URL for a GET request for further information was expected/);
    });

});
