import {WaasApi} from "./waas-api";
import * as assert from "assert";
import {ConflictError} from "./errors";
import {Wallet} from "./wallet";
import {mockSandbox, queueOpenApiResponse} from "./test-helpers";
import axios from "axios";
import {EthWallet} from "./eth-wallet";

describe("Wallet", function() {
    mockSandbox();

    const auth = {
        clientId: "1",
        clientSecret: "2",
        subscription: "3",
    };

    const dummyWalletName = "ae5de2d7-6314-463e-a470-0a47812fcbec";

    const queue = queueOpenApiResponse("openapi/v1.1.oas2.json");

    it("should construct an instance", function() {
        const wallet = new Wallet(this.sandbox.stub(axios, "create"));
        assert.ok(wallet instanceof Wallet);
    });

    it("should throw due invalid authentication", async function() {
        const w = new WaasApi({
            clientId: "1",
            clientSecret: "2",
            subscription: "3",
            ethereumNetwork: undefined,
            ethereumTxSpeed: undefined,
            vaultUrl: "",
        });

        await queue({
            path: "/wallet",
            operation: "get",
            response: 401,
        });

        try {
            await w.wallet().create(dummyWalletName, false);
        } catch (e) {
            console.log(e);
        }
    });

    describe("list", function() {
        it("should return a page of wallets", async function() {
            const w = new WaasApi(auth);

            await queue({
                path: "/wallet",
                operation: "get",
                response: 200,
            });

            const {list, skiptoken} = (await w.wallet().list()).data;
            assert.ok(list.length > 0);
            assert.ok(skiptoken);
        });
    });

    describe("create", function() {
        it("should respond with a new wallet", async function() {
            const w = new WaasApi(auth);

            await queue({
                path: "/wallet",
                operation: "post",
                response: 201,
            });

            const {wallet, created, security, updated, version} = (await w.wallet().create(dummyWalletName, false)).data;
            assert.ok(wallet);
            assert.ok(created);
            assert.ok(security);
            assert.ok(updated);
            assert.ok(version);
        });
        
        it("should fail due to occupied wallet name", async function() {
            const w = new WaasApi(auth);

            await queue({
                path: "/wallet",
                operation: "post",
                response: 409,
            });

            try {
                await w.wallet().create(dummyWalletName);
                assert.fail("should have thrown");
            } catch (e) {
                console.log(e);
                assert.strictEqual(e.status, 409);
                assert.ok(e instanceof ConflictError);
            }
        });
    });

    describe("delete", function() {
        it("should respond with deleted wallet", async function() {
            const w = new WaasApi(auth);

            await queue({
                path: "/wallet/{wallet}",
                operation: "delete",
                response: 200,
            });

            const {recoveryId, scheduledPurgeDate} = (await w.wallet(dummyWalletName).delete()).data;
            assert.ok(recoveryId);
            assert.ok(scheduledPurgeDate);
        });
    });

    describe("get", function() {
        it("should retrieve the wallet by name", async function() {
            const w = new WaasApi(auth);

            await queue({
                path: "/wallet/{wallet}",
                operation: "get",
                response: 200,
            });

            const {wallet, created, security, updated, version} = (await w.wallet(dummyWalletName).get()).data;
            assert.ok(wallet);
            assert.ok(created);
            assert.ok(security);
            assert.ok(updated);
            assert.ok(version);
        });
    });

    describe("eth", function() {
        it("should return a EthWallet instance", async function() {
            const w = new WaasApi(auth);
            const ethWallet = w.wallet(dummyWalletName).eth();
            assert.ok(ethWallet instanceof EthWallet);
        });
    });
});
