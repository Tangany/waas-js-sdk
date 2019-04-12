import {WaasApi} from "./waas-api";
import * as assert from "assert";
import {Ethereum} from "./eth";
import {mockSandbox} from "./test-helpers";
import {Wallet} from "./wallet";

describe("WaasApi", function () {
    mockSandbox();

    const auth = {
        clientId: "1",
        clientSecret: "2",
        subscription: "3",
    };

    it("should construct an instance", function () {
        const w = new WaasApi(auth);
        assert.ok(w instanceof WaasApi);
    });

    it("should throw on missing auth params", function () {
        assert.throws(() => new WaasApi({clientId: "", ethereumNetwork: undefined, subscription: "", vaultUrl: "", clientSecret: "d"}));
    });

    describe("wallet", function () {
        it("should return a EthWallet instance", async function () {
            const w = new WaasApi(auth);
            assert.ok(w.wallet instanceof Wallet);
        });
    });

    describe("ethereum", function () {
        it("should return a EthWallet instance", async function () {
            const w = new WaasApi(auth);
            assert.ok(w.ethereum instanceof Ethereum);
        });
    });
});
