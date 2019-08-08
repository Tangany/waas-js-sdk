import * as assert from "assert";
import {Bitcoin} from "./btc";
import {AuthenticationError, ConflictError, GeneralError, NotFoundError} from "./errors";
import {Ethereum} from "./eth";
import {sandbox} from "./helpers";
import {
    BitcoinNetwork,
    BitcoinTxConfirmations,
    BitcoinTxSpeed,
    EthereumPublicNetwork,
    EthereumTxSpeed,
    WaasApi,
} from "./waas-api";
import {Wallet} from "./wallet";
import * as moxios from "moxios";

sandbox();

describe("WaasApi", function() {

    const auth = {
        clientId: "1",
        clientSecret: "2",
        subscription: "3",
    };

    it("should construct an instance", function() {
        assert.ok(new WaasApi(auth));
        assert.ok(new WaasApi({
            ...auth,
            vaultUrl: "https://my-vault.some-cloud.tld",
            ethereumNetwork: EthereumPublicNetwork.ROPSTEN,
            ethereumTxSpeed: EthereumTxSpeed.DEFAULT,
            bitcoinNetwork: BitcoinNetwork.BITCOIN,
            bitcoinTxSpeed: BitcoinTxSpeed.FAST,
            bitcoinTxConfirmations: BitcoinTxConfirmations.SECURE,
            bitcoinMaxFeeRate: 600,
        }));
    });

    it("should throw for missing or invalid authentication", function() {
        assert.throws(() => new WaasApi({} as any));
        assert.throws(() => new WaasApi({...auth, clientId: ""}));
        assert.throws(() => new WaasApi({clientId: "123"} as any));
        assert.throws(() => new WaasApi({clientId: "123", clientSecret: true} as any));
    });

    it("should throw for invalid options", function() {
        assert.throws(() => new WaasApi({...auth, vaultUrl: true} as any));
        assert.throws(() => new WaasApi({...auth, ethereumNetwork: 23} as any));
        assert.throws(() => new WaasApi({...auth, ethereumTxSpeed: eval} as any));
        assert.throws(() => new WaasApi({...auth, bitcoinNetwork: 1} as any));
        assert.throws(() => new WaasApi({...auth, bitcoinTxSpeed: Symbol} as any));
        assert.throws(() => new WaasApi({...auth, bitcoinTxConfirmations: -2} as any));
        assert.throws(() => new WaasApi({...auth, bitcoinMaxFeeRate: "yak"} as any));
    });

    describe("axios", function() {

        it("should return a preconfigured AxiosInstance", function() {
            const {axios: axiosInstance} = new WaasApi(auth);
            this.sandbox.stub(axiosInstance, "get").resolves({response: {status: 202}});
            assert.doesNotReject(async () => axiosInstance.get("/"));
        });

        describe("Errors", function() {

            beforeEach(function() {
                moxios.install();
            });

            afterEach(function() {
                moxios.uninstall();
            });

            it("should throw a NotFoundError error for 404 server response", async function() {
                moxios.stubRequest(/.*/, {
                    status: 404,
                    response: {message: "NotFoundError"},
                });
                const {axios: axiosInstance} = new WaasApi(auth);

                await assert.rejects(async () => axiosInstance.get("bielefeld"), NotFoundError);
            });

            it("should throw a AuthenticationError error for 401 server response", async function() {
                moxios.stubRequest(/.*/, {
                    status: 401,
                    response: {message: "AuthenticationError"},
                });
                const {axios: axiosInstance} = new WaasApi(auth);
                await assert.rejects(async () => axiosInstance.get("navorski"), AuthenticationError);
            });

            it("should throw a ConflictError error for 409 server response", async function() {
                moxios.stubRequest(/.*/, {
                    status: 409,
                    response: {message: "ConflictError"},
                });
                const {axios: axiosInstance} = new WaasApi(auth);
                await assert.rejects(async () => axiosInstance.get("bielefeld"), ConflictError);
            });

            it("should throw a GeneralError for 400 server response", async function() {
                moxios.stubRequest(/.*/, {
                    status: 400,
                    response: {message: "GeneralError"},
                });
                const {axios: axiosInstance} = new WaasApi(auth);
                await assert.rejects(async () => axiosInstance.get("bielefeld"), GeneralError);
            });
        });
    });

    describe("wallet", function() {
        it("should return a Wallet instance", async function() {
            const w = new WaasApi(auth);
            assert.ok(w.wallet() instanceof Wallet);
        });
    });

    describe("eth", function() {
        it("should return a Ethereum instance", async function() {
            const w = new WaasApi(auth);
            assert.ok(w.eth() instanceof Ethereum);
        });
    });

    describe("btc", function() {
        it("should return a Bitcoin instance", async function() {
            const w = new WaasApi(auth);
            assert.ok(w.btc() instanceof Bitcoin);
        });
    });
})
;
