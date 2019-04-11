import {WaasApi} from "./waas-api";
import * as assert from "assert";
import {ConflictError} from "./errors/conflict-error";
import {Wallet} from "./wallet";
import {mockSandbox, queueOpenApiResponse} from "./test-helpers";
import axios from "axios";
import {EthWallet} from "./eth-wallet";
import {EthErc20Token} from "./eth-erc20-token";

describe("Wallet", function () {
    mockSandbox();

    const CLIENT_ID = "1",
        CLIENT_SECRET = "2",
        SUBSCRIPTION = "3"
    ;

    const queue = queueOpenApiResponse("openapi/v1.1.oas2.json");

    it("should construct an instance", function () {
        const wallet = new Wallet(this.sandbox.stub(axios, "create"));
        assert.ok(wallet instanceof Wallet);
    });

    it("should throw due invalid authentication", async function () {
        const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
        const _wallet = w.wallet;

        await queue({
            path: "/wallet",
            operation: "get",
            response: 401,
        });

        try {
            await _wallet.createWallet("ae5de2d7-6314-463e-a470-0a47812fcbec");
        } catch (e) {
            console.log(e);
        }

    });

    describe("listWallets", function () {
        it("should return a page of wallets", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            const _wallet = w.wallet;

            await queue({
                path: "/wallet",
                operation: "get",
                response: 200,
            });

            const {list, skiptoken} = (await _wallet.listWallets()).data;
            assert.ok(list.length > 0);
            assert.ok(skiptoken);
        });
    });

    describe("createWallet", function () {
        it("should respond with a new wallet", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            const _wallet = w.wallet;

            await queue({
                path: "/wallet",
                operation: "post",
                response: 201,
            });

            const {wallet, created, security, updated, version} = (await _wallet.createWallet("ae5de2d7-6314-463e-a470-0a47812fcbec")).data;
            assert.ok(wallet);
            assert.ok(created);
            assert.ok(security);
            assert.ok(updated);
            assert.ok(version);
        });

        it("should fail due to missing wallet name", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            const wallet = w.wallet;

            await assert.rejects(async () => wallet.createWallet(""));
        });

        it("should fail due to occupied wallet name", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            const wallet = w.wallet;

            await queue({
                path: "/wallet",
                operation: "post",
                response: 409,
            });

            try {
                await wallet.createWallet("ae5de2d7-6314-463e-a470-0a47812fcbec");
                assert.fail("should have thrown");
            } catch (e) {
                console.log(e);
                assert.strictEqual(e.status, 409);
                assert.ok(e instanceof ConflictError);
            }
        });

    });

    describe("deleteWallet", function () {
        it("should respond with deleted wallet", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            const _wallet = w.wallet;

            await queue({
                path: "/wallet/{wallet}",
                operation: "delete",
                response: 200,
            });

            const {recoveryId, scheduledPurgeDate} = (await _wallet.deleteWallet("ae5de2d7-6314-463e-a470-0a47812fcbec")).data;
            assert.ok(recoveryId);
            assert.ok(scheduledPurgeDate);
        });
    });

    describe("getWallet", function () {
        it("should retrieve the wallet by name", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            const _wallet = w.wallet;

            await queue({
                path: "/wallet/{wallet}",
                operation: "get",
                response: 200,
            });

            const {wallet, created, security, updated, version} = (await _wallet.getWallet("ae5de2d7-6314-463e-a470-0a47812fcbec")).data;
            assert.ok(wallet);
            assert.ok(created);
            assert.ok(security);
            assert.ok(updated);
            assert.ok(version);
        });
    });

    describe("eth", function () {
        it("should return a EthWallet instance", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            const _wallet = w.wallet.eth("some-wallet");
            assert.ok(_wallet instanceof EthWallet);
        });
    });

    describe("ethErc20", function () {
        it("should return a EthErc20Wallet instance", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            const _wallet = w.wallet.ethErc20("some-wallet", "0xB8c77482e45F1F44dE1745F52C74426C631bDD52");
            assert.ok(_wallet instanceof EthErc20Token);
        });
    });
});
