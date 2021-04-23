import * as assert from "assert";
import axios from "axios";
import {SinonSpyCall} from "sinon";
import {ISearchResponse} from "../../interfaces/common";
import {sandbox} from "../../utils/spec-helpers";
import {Waas} from "../../waas";
import {ResourceIterable} from "./resource-iterable";

// Fake return value of each iteration
interface IIteratorValue {
    foo: string;
    bar: boolean
}

// Use a concrete implementation since abstract classes cannot be tested as such
class TestResourceIterable extends ResourceIterable<ISearchResponse, IIteratorValue> {
    protected convertResponseItem(item: ISearchResponse["list"][0]): IIteratorValue {
        return {
            foo: item.links[0].rel,
            bar: true,
        }
    }
}


// This test suite does not always use realistic responses for the mocked API responses.
// Otherwise it becomes too cumbersome to simulate e.g. the updated pagination links or new items on the next page.
// However, this does not matter for the tests itself.

sandbox();

describe("ResourceIterable", function() {

    const sampleResponse: ISearchResponse = {
        hits: {total: 3},
        list: [
            {links: [{type: "GET", rel: "test", href: "/test/123"}]},
            {links: [{type: "GET", rel: "test", href: "/test/456"}]},
            {links: [{type: "GET", rel: "test", href: "/test/789"}]},
        ],
        links: {previous: null, next: "eth/transactions"},
    }

    const lastPageResponse: ISearchResponse = {
        ...sampleResponse,
        links: {
            previous: null, next: null,
        }
    };

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    describe("[Symbol.asyncIterator]", function() {

        it("should return all items even if there is only one page", async function() {
            this.sandbox.stub(this.waas.instance, "get").resolves(lastPageResponse);
            const iterable = new TestResourceIterable(this.waas, {url: "eth/transactions"});
            let itemCounter = 0;
            for await (const item of iterable) {
                assert.ok(item.foo);
                assert.ok(item.bar);
                itemCounter++;
            }
            assert.strictEqual(itemCounter, lastPageResponse.list.length);
        });

        it("should iterate through all linked pages", async function() {
            const numOfPages = 4;
            const stub = this.sandbox.stub(this.waas.instance, "get");
            stub.resolves(sampleResponse).onCall(numOfPages - 1).resolves(lastPageResponse);

            const iterable = new TestResourceIterable(this.waas, {url: "eth/transactions"});
            let itemCounter = 0;
            for await (const item of iterable) {
                assert.ok(item.foo);
                assert.ok(item.bar);
                itemCounter++;
            }
            assert.strictEqual(itemCounter, numOfPages * sampleResponse.list.length);
            // Important: This implies that the corresponding page is not fetched again with each iteration, but that an HTTP request takes place only once per page.
            assert.strictEqual(stub.callCount, numOfPages);
        });

        it("should use the query parameters only for the first call", async function() {
            const params = {limit: 6, sort: "desc"};
            const iterable = new TestResourceIterable(this.waas, {url: "eth/transactions", params});
            const amountOfPages = 4;
            const stub = this.sandbox.stub(this.waas.instance, "get").resolves(sampleResponse).onCall(amountOfPages - 1).resolves(lastPageResponse);
            for await (const _item of iterable) {
                // Just a dummy loop to iterate through all items conveniently
            }
            stub.getCalls().forEach((call: SinonSpyCall, index: number) => {
                const usedParams = call.args[1]?.params;
                if (index === 0) {
                    assert.strictEqual(usedParams, params);
                } else {
                    assert.ok(!usedParams || Object.keys(usedParams).length === 0);
                }
            });
        });

        it("should not execute another initial HTTP request if the first page has already been fetched", async function() {
            const stub = this.sandbox.stub(this.waas.instance, "get").resolves(lastPageResponse);
            const iterable = new TestResourceIterable(this.waas, {url: "eth/transactions"});
            await iterable.hits;
            assert.ok(stub.calledOnce);
            await iterable[Symbol.asyncIterator]().next();
            assert.ok(stub.calledOnce);// Should not have been called again in between
        });

        it("should apply the custom item conversion", async function() {
            this.sandbox.stub(this.waas.instance, "get").resolves(lastPageResponse);
            const iterable = new TestResourceIterable(this.waas, {url: "eth/transactions"});
            for await (const item of iterable) {
                assert.deepStrictEqual(item, {foo: "test", bar: true})
            }
        });

    });

    describe("hits", function() {

        it("should return the expected value", async function() {
            this.sandbox.stub(this.waas.instance, "get").resolves(lastPageResponse);
            const iterable = new TestResourceIterable(this.waas, {url: "eth/transactions"});
            const hits = await iterable.hits;
            assert.strictEqual(hits, lastPageResponse.hits);
        });

        it("should not execute another HTTP request if the getter has already been used", async function() {
            const stub = this.sandbox.stub(this.waas.instance, "get").resolves(lastPageResponse);
            const iterable = new TestResourceIterable(this.waas, {url: "eth/transactions"});
            const hits1 = await iterable.hits;
            assert.strictEqual(hits1, lastPageResponse.hits);
            assert.ok(stub.calledOnce);
            const hits2 = await iterable.hits;
            assert.ok(stub.calledOnce);// Should not have been called again in between
            assert.strictEqual(hits1, hits2);
        });

        it("should not execute an HTTP request if the iterator has already been used", async function() {
            const stub = this.sandbox.stub(this.waas.instance, "get").resolves(lastPageResponse);
            const iterable = new TestResourceIterable(this.waas, {url: "eth/transactions"});
            await iterable[Symbol.asyncIterator]().next();
            assert.ok(stub.calledOnce);
            const hits = await iterable.hits;
            assert.ok(stub.calledOnce); // Should not have been called again in between
            assert.strictEqual(hits, lastPageResponse.hits);
        });

    });

});
