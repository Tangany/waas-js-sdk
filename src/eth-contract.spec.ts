import * as assert from "assert";
import axios from "axios";
import {EthereumContract} from "./eth-contract";
import {ISearchContractEventsResponse} from "./interfaces";
import {sandbox} from "./spec-helpers";
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

// The method only calls the general function for wrapping search queries and this is tested in detail separately anyway.
    describe("getEvents", function() {

        it("should execute the api call", async function() {
            const sampleResponse: ISearchContractEventsResponse = {
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
