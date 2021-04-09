import * as assert from "assert";
import axios from "axios";
import {SinonSpyCall} from "sinon";
import {ISearchResponse} from "../interfaces/common";
import {sandbox} from "../utils/spec-helpers";
import {Waas} from "../waas";
import {IDefaultIteratorValue, ResourcePageIterable} from "./resource-page-iterable";

interface IIteratorValue extends IDefaultIteratorValue<{ mappedProperty: string }> {
}

// Use a concrete implementation since abstract classes cannot be tested as such
class TestResourcePageIterable extends ResourcePageIterable<ISearchResponse, IIteratorValue> {

    protected convertApiResponse(res: ISearchResponse): IIteratorValue {
        const list = res.list.map(x => ({mappedProperty: x.links[0].href}));
        return {
            hits: res.hits,
            list,
        }
    }

}

describe("ResourcePageIterable", function() {

    sandbox();

    const sampleResponse: ISearchResponse = {
        hits: {total: 4},
        list: [], // This would contain 4 items but that doesn't matter for testing purposes
        links: {next: "eth/transactions", previous: null},
    };

    const noLinksResponse: ISearchResponse = {...sampleResponse, links: {previous: null, next: null}};

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should provide a method for the next page", async function() {
        const stub = this.sandbox.stub(this.waas.instance, "get").onFirstCall().resolves(sampleResponse).onSecondCall().resolves(noLinksResponse);

        const iterable = new TestResourcePageIterable(this.waas, {url: "eth/transactions"});
        const iterator = iterable[Symbol.asyncIterator]();
        await iterator.next();
        const secondPage = (await iterator.next()).value;
        assert.ok(secondPage);
        const pageAfterSecond = await iterator.next();
        assert.strictEqual(pageAfterSecond.value, null);
        assert.ok(pageAfterSecond.done);

        assert.ok(stub.calledTwice);
    });

    it("should provide a method for the previous page", async function() {
        const firstResponse: ISearchResponse = {
            ...sampleResponse,
            links: {previous: "any/previous/page", next: null}
        };
        const secondResponse: ISearchResponse = {
            ...sampleResponse,
            links: {next: "any/next/page", previous: null}
        };
        const stub = this.sandbox.stub(this.waas.instance, "get").onFirstCall().resolves(firstResponse).onSecondCall().resolves(secondResponse);

        const iterable = new TestResourcePageIterable(this.waas, {url: "foo/bar"});
        const iterator = iterable[Symbol.asyncIterator]();

        await iterator.next(); // fetch the initial page
        const prevPage = (await iterator.previous()).value; // page with a link to the previous page
        assert.notStrictEqual(prevPage, null);
        const pageBeforePrevious = (await iterator.previous()); // no results
        assert.strictEqual(pageBeforePrevious.value, null);
        assert.ok(pageBeforePrevious.done);

        assert.ok(stub.calledTwice);
    });

    it("should be iterable in a for await ... of loop", async function() {
        const response: ISearchResponse = {
            ...sampleResponse,
            list: [{links: [{type: "GET", rel: "test", href: "/test/123"}]}],
        }

        const stub = this.sandbox.stub(this.waas.instance, "get").withArgs("eth/transactions");
        stub.onFirstCall().resolves(response); // initial call
        stub.onSecondCall().resolves(response); // second call
        stub.onThirdCall().resolves({...response, links: {next: null}}); // third call without next link

        const iterable = new TestResourcePageIterable(this.waas, {url: "eth/transactions"});
        for await (const page of iterable) {
            assert.ok(page.hits);
            assert.ok(page.list.length);
        }

        assert.strictEqual(stub.callCount, 3);
    });


    it("should not throw an error if there is no next or previous page", async function() {
        const stub = this.sandbox.stub(this.waas.instance, "get").resolves(noLinksResponse);

        const iterable = new TestResourcePageIterable(this.waas, {url: "eth/transactions"});
        const iterator = iterable[Symbol.asyncIterator]();
        await iterator.next(); // fetch initial page
        // There should be no page before or after the first page (as there is only one page in total)
        const nextPage = (await iterator.next()).value;
        const prevPage = (await iterator.previous()).value;

        // Expect the method to return null without throwing an error
        assert.strictEqual(nextPage, null);
        assert.strictEqual(prevPage, null);
        assert.ok(stub.calledOnce);
    });

    it("should apply the query parameters only for the first call", async function() {
        const params = {anyParam: "abc", isTest: true};
        const iterable = new TestResourcePageIterable(this.waas, {url: "eth/transactions", params});

        const lastResponse: ISearchResponse = {...sampleResponse, links: {previous: "any/previous", next: null}};
        const amountOfPages = 4;
        const stub = this.sandbox.stub(this.waas.instance, "get").resolves(sampleResponse).onCall(amountOfPages - 1).resolves(lastResponse);

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

});
