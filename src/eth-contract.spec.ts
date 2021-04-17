import * as assert from "assert";
import axios from "axios";
import {EthereumContract} from "./eth-contract";
import {IEventSearchResponse} from "./interfaces/ethereum-contract";
import {EthEventIterable} from "./iterables/auto-pagination/eth-event-iterable";
import {EthEventPageIterable} from "./iterables/pagewise/eth-event-page-iterable";
import {sandbox} from "./utils/spec-helpers";
import {Waas} from "./waas";

sandbox();

describe("EthereumContract", function() {

    const tokenAddress = "0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        const contract = new EthereumContract(this.stub, tokenAddress);
        assert.ok(contract);
    });

    describe("getEvents", function() {

        it("should return a page-wise returning iterable if the autoPagination option is not enabled", function() {
            const ethContract = new EthereumContract(this.waas, tokenAddress);
            const iterable1 = ethContract.getEvents({});
            assert.ok(iterable1 instanceof EthEventPageIterable);
            const iterable2 = ethContract.getEvents({}, {});
            assert.ok(iterable2 instanceof EthEventPageIterable);
            const iterable3 = ethContract.getEvents({}, {autoPagination: false});
            assert.ok(iterable3 instanceof EthEventPageIterable);
        });

        it("should return an item-wise returning iterable if the autoPagination option is enabled", function() {
            const iterable = new EthereumContract(this.waas, tokenAddress).getEvents({}, {autoPagination: true});
            assert.ok(iterable instanceof EthEventIterable);
        });

        it("should execute the api call", async function() {
            const sampleResponse: IEventSearchResponse = {
                hits: {total: 4},
                list: [
                    {
                        event: "Transfer",
                        links: [{type: "GET", href: "/eth/transaction/0x.../event/2", rel: "event"}]
                    },
                ],
                links: {next: null, previous: null}
            };
            const stub = this.waas.instance.get = this.sandbox.stub().resolves(sampleResponse);
            const iterable =  new EthereumContract(this.waas, tokenAddress).getEvents();
            await iterable[Symbol.asyncIterator]().next();
            assert.ok(stub.calledOnce);
        });

    });

})
