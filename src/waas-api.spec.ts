import {WaasApi} from "./waas-api";
import * as assert from "assert";
import {Ethereum} from "./eth";
import {mockSandbox} from "./test-helpers";
import {Wallet} from "./wallet";

describe("WaasApi", function () {
    mockSandbox();

    const CLIENT_ID = "1",
        CLIENT_SECRET = "2",
        SUBSCRIPTION = "3"
    ;

    it("should construct an instance", function () {
        const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
        assert.ok(w instanceof WaasApi);
    });

    it("should throw on missing auth params", function () {
        assert.throws(() => new WaasApi(CLIENT_ID, "", ""));
    });

    describe("wallet", function () {
        it("should return a EthWallet instance", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            assert.ok(w.wallet instanceof Wallet);
        });
    });

    describe("ethereum", function () {
        it("should return a EthWallet instance", async function () {
            const w = new WaasApi(CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION);
            assert.ok(w.ethereum instanceof Ethereum);
        });
    });
});
