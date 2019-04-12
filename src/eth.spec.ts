import {mockSandbox, queueOpenApiResponse} from "./test-helpers";
import axios from "axios";
import * as assert from "assert";
import {Ethereum} from "./eth";
import {WaasApi} from "./waas-api";
import {TimeoutError} from "./errors";

describe("Ethereum", function () {
    mockSandbox();

    const auth = {
        clientId: "1",
        clientSecret: "2",
        subscription: "3",
    };
    const sampleTx = "0x8a72609aaa14c4ff4bd44bd75848c27efcc36b3341d170000000000000000000";
    const queue = queueOpenApiResponse("openapi/v1.1.oas2.json");

    it("should construct an instance", function () {
        const wallet = new Ethereum(this.sandbox.stub(axios, "create"));
        assert.ok(wallet instanceof Ethereum);
    });

    describe("getTxStatus", function () {
        it("should return a status for given hash", async function () {
            const w = new WaasApi(auth);
            const _eth = w.ethereum;

            await queue({
                path: "/eth/transaction/{hash}",
                operation: "get",
                response: 200,
            });

            const d = (await _eth.getTxStatus(sampleTx)).data;
            assert.ok(d.hasOwnProperty("blockNr"));
            assert.ok(d.hasOwnProperty("isError"));
        });
    });

    describe("waitForMined", function () {
        this.timeout(2000);

        it("should resolve for given transaction", async function () {
            const w = new WaasApi(auth);
            const _eth = w.ethereum;

            await queue({
                path: "/eth/transaction/{hash}",
                operation: "get",
                response: 200,
                delay: 400,
            });

            const d = await _eth.waitForMined(sampleTx, 9000);

            console.log(d);
            assert.ok(d.hasOwnProperty("blockNr"));
            assert.ok(d.hasOwnProperty("isError"));
        });

        it("should throw for a server timeout", function (done) {
            const w = new WaasApi(auth);
            const _eth = w.ethereum;
            _eth
                .waitForMined(sampleTx, 1000)
                .then(() => assert.fail("should have thrown"))
                .catch(e => {
                    assert.ok(e instanceof TimeoutError);
                    done();
                });
        });
    });
});
