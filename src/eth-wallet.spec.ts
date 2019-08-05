import {mockSandbox, queueOpenApiResponse} from "./test-helpers";
import axios from "axios";
import * as assert from "assert";
import {WaasApi} from "./waas-api";
import {EthWallet} from "./eth-wallet";
import {EthErc20Token} from "./eth-erc20-token";
import {Wallet} from "./wallet";

describe("EthWallet", function() {
    mockSandbox();

    const auth = {
        clientId: "1",
        clientSecret: "2",
        subscription: "3",
    };

    const queue = queueOpenApiResponse("openapi/v1.oas2.json");
    const sampleWallet = "sample-wallet";
    const sampleAddress = "0xcbbe0c0454f3379ea8b0fbc8cf976a54154937c1";

    it("should construct an instance", function() {
        const ethErc20 = new EthWallet(this.sandbox.stub(axios, "create"), this.sandbox.createStubInstance(Wallet));
        assert.ok(ethErc20 instanceof EthWallet);
    });

    describe("balance", function() {
        it("should return the balance for given wallet", async function() {
            const w = new WaasApi(auth);

            await queue({
                path: "/eth/wallet/{wallet}",
                operation: "get",
                response: 200,
            });

            const {address, balance, currency} = (await w.wallet(sampleWallet).eth().get()).data;
            assert.ok(address);
            assert.ok(balance);
            assert.ok(currency);
        });
    });
    describe("send", function() {
        it("should return the hash fro sent transaction", async function() {
            const w = new WaasApi(auth);

            await queue({
                path: "/eth/wallet/{wallet}/send",
                operation: "post",
                response: 202,
            });

            const {hash} = (await w.wallet(sampleWallet).eth().send(sampleAddress, "1.23")).data;
            assert.ok(hash);
        });
    });

    describe("erc20", function() {
        it("should return a EthErc20Wallet instance", async function() {
            const w = new WaasApi(auth);
            const _wallet = w.wallet(sampleWallet).eth().erc20("0xB8c77482e45F1F44dE1745F52C74426C631bDD52");
            assert.ok(_wallet instanceof EthErc20Token);
        });
    });
});
