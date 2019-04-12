import {mockSandbox, queueOpenApiResponse} from "./test-helpers";
import axios from "axios";
import * as assert from "assert";
import {WaasApi} from "./waas-api";
import {EthErc20Token} from "./eth-erc20-token";

describe("EthErc20Token", function () {
    mockSandbox();

    const auth = {
            clientId: "1",
            clientSecret: "2",
            subscription: "3",
        };
    const sampleWallet = "sample-wallet";
    const sampleErc20 = "0xB1c77482e45F1F44dE1745F52C74426C631beD50";
    const queue = queueOpenApiResponse("openapi/v1.1.oas2.json");

    it("should construct an instance", function () {
        const ethErc20 = new EthErc20Token(this.sandbox.stub(axios, "create"), sampleWallet, sampleErc20);
        assert.ok(ethErc20 instanceof EthErc20Token);
    });

    describe("getTokenBalance", function () {
        it("should return the balance for given token", async function () {
            const w = new WaasApi(auth);
            const _erc20 = w.wallet.ethErc20(sampleWallet, sampleErc20);

            await queue({
                path: "/eth/erc20/{token}/{wallet}",
                operation: "get",
                response: 200,
            });

            const {balance, currency} = (await _erc20.getTokenBalance()).data;
            assert.ok(balance);
            assert.ok(currency);
        });
    });
    describe("sendToken", function () {
        it("should return a hash for sent tokens", async function () {
            const w = new WaasApi(auth);
            const _erc20 = w.wallet.ethErc20(sampleWallet, sampleErc20);

            await queue({
                path: "/eth/erc20/{token}/{wallet}/send",
                operation: "post",
                response: 202,
            });

            const {hash} = (await _erc20.sendToken("0xbcf8f31f996f31ab26014832b952816309c7730e", "101.23")).data;
            assert.ok(hash);
        });
    });
});
