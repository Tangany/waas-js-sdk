import * as assert from "assert";
import axios from "axios";
import {EthTransactionRequest} from "./eth-transaction-request";
import {IAsyncRequestStatus} from "./interfaces/common";
import {IAsyncEthereumTransactionOutput} from "./interfaces/ethereum";
import {sandbox} from "./utils/spec-helpers";
import {Waas} from "./waas";

type ApiResponse = IAsyncRequestStatus<IAsyncEthereumTransactionOutput>;

describe("EthTransactionRequest", function() {

    sandbox();

    const requestId = "71c4f385a4124239b6c968e47ea95f73";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        const txRequest = new EthTransactionRequest(this.waas, requestId);
        assert.ok(txRequest instanceof EthTransactionRequest);
    });

    describe("get", function() {

        const completedTxResponse: ApiResponse = {
            process: "Completed",
            status: {
                stage: "transaction confirmed"
            },
            created: new Date("2021-04-22T08:36:21Z"),
            updated: new Date("2021-04-22T08:38:08Z"),
            output: {
                hash: "0x8a1839379f5cdc2d4e1f9207e39117f273109e52aa435e620b3bdfb9580f82b9",
                nonce: 165429,
                blockNr: 10086823,
                data: "0xf00ba7",
                status: "confirmed",
                links: [{
                    href: "/eth/transaction/0x8a1839379f5cdc2d4e1f9207e39117f273109e52aa435e620b3bdfb9580f82b9",
                    type: "GET",
                    rel: "transaction",
                }]
            }
        }

        it("should not throw an error if there is no output", async function() {
            const response: ApiResponse = {
                process: "Running",
                status: {
                    stage: "gathering prerequisites"
                },
                created: new Date("2021-04-22T08:36:21Z"),
                updated: new Date("2021-04-22T08:36:30Z"),
                output: null
            }
            const stub = this.waas.instance.get = this.sandbox.stub().resolves(response);
            const req = new EthTransactionRequest(this.waas, requestId);

            const currentStatus = await req.get();

            assert.strictEqual(currentStatus.output, null);
            assert.ok(stub.calledOnce);
        });

        it("should not omit any details of the API response", async function() {
            const stub = this.waas.instance.get = this.sandbox.stub().resolves(completedTxResponse);
            const req = new EthTransactionRequest(this.waas, requestId);

            const currentStatus = await req.get();

            // Ignore the "output" field for this test, since is tested separately
            delete currentStatus.output;
            const {output, ...rest} = completedTxResponse;
            const expected = Object.assign({}, rest);
            assert.deepStrictEqual(currentStatus, expected);
            assert.ok(stub.calledOnce);
        });

        it("should return the expected transaction object once completed", async function() {
            const stub = this.waas.instance.get = this.sandbox.stub().resolves(completedTxResponse);
            const req = new EthTransactionRequest(this.waas, requestId);

            const {process, output} = await req.get();

            assert.ok(process === "Completed");
            if (!output) {
                assert.fail("Property \"output\" does not exist");
            }
            const {hash, blockNr, data, nonce, status} = output;
            assert.ok(hash);
            assert.ok(blockNr);
            assert.ok(data);
            assert.ok(nonce);
            assert.ok(status);
            assert.ok("get" in output && typeof output.get === "function");
            assert.ok(stub.calledOnce);
        });

    });

});


