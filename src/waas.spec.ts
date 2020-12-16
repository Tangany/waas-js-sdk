import * as assert from "assert";
import {Bitcoin} from "./btc";
import {AuthenticationError, ConflictError, GeneralError, NotFoundError} from "./errors";
import {Ethereum} from "./eth";
import {Request} from "./request"
import {sandbox} from "./utils/spec-helpers";
import {
    BitcoinNetwork,
    BlockchainTxConfirmations,
    BitcoinTxSpeed,
    EthereumPublicNetwork,
    EthereumTxSpeed,
    Waas, ApiVersion,
} from "./waas";
import {Wallet} from "./wallet";
import * as moxios from "moxios";

sandbox();

describe("Waas", function() {

    const auth = {
        clientId: "1",
        clientSecret: "2",
        subscription: "3",
    };

    it("should construct an instance", function() {
        assert.ok(new Waas(auth));
        assert.ok(new Waas({
            ...auth,
            vaultUrl: "https://my-vault.some-cloud.tld",
            ethereumNetwork: EthereumPublicNetwork.ROPSTEN,
            ethereumTxSpeed: EthereumTxSpeed.DEFAULT,
            bitcoinNetwork: BitcoinNetwork.BITCOIN,
            bitcoinTxSpeed: BitcoinTxSpeed.FAST,
            bitcoinTxConfirmations: BlockchainTxConfirmations.SECURE,
            bitcoinMaxFeeRate: 600,
        }));
        assert.ok(new Waas(auth, "https://some-dev-url" as ApiVersion));
        assert.ok(new Waas(auth, undefined, false));
    });

    it("should construct an instance with environment variables", function() {
        this.sandbox.stub(process, "env").value({
            TANGANY_CLIENT_ID: auth.clientId,
            TANGANY_CLIENT_SECRET: auth.clientSecret,
            TANGANY_SUBSCRIPTION: auth.subscription,
        });
        assert.ok(new Waas());
        assert.ok(new Waas({
            ethereumNetwork: EthereumPublicNetwork.ROPSTEN,
        }));
    });

    it("should fail constructing a new instance due to missing authentication", function() {
        assert.throws(() => new Waas(), /Missing variable 'clientId'/);
    });

    it("should throw for missing or invalid authentication", function() {
        assert.throws(() => new Waas({} as any));
        assert.throws(() => new Waas({...auth, clientId: ""}));
        assert.throws(() => new Waas({clientId: "123"} as any));
        assert.throws(() => new Waas({clientId: "123", clientSecret: true} as any));
    });

    it("should throw for invalid options", function() {
        assert.throws(() => new Waas({...auth, vaultUrl: true} as any));
        assert.throws(() => new Waas({...auth, ethereumNetwork: 23} as any));
        assert.throws(() => new Waas({...auth, ethereumGasPrice: 12345678} as any));
        assert.throws(() => new Waas({...auth, ethereumGas: "12345,6"} as any));
        assert.throws(() => new Waas({...auth, ethereumNonce: "42"} as any));
        assert.throws(() => new Waas({...auth, useGasTank: "yes"} as any));
        assert.throws(() => new Waas({...auth, ethereumTxSpeed: eval} as any));
        assert.throws(() => new Waas({...auth, bitcoinNetwork: 1} as any));
        assert.throws(() => new Waas({...auth, bitcoinTxSpeed: Symbol} as any));
        assert.throws(() => new Waas({...auth, bitcoinTxConfirmations: true} as any));
        assert.throws(() => new Waas({...auth, bitcoinMaxFeeRate: "yak"} as any));
    });

    describe("axios", function() {

        it("should return a preconfigured AxiosInstance", async function() {
            const {axios: axiosInstance} = new Waas(auth);
            await assert.strictEqual(typeof axiosInstance.get, "function");
        });

        describe("Errors", function() {

            beforeEach(function() {
                moxios.install();
            });

            afterEach(function() {
                moxios.uninstall();
            });

            it("should pass the response through the interceptor", async function() {
                moxios.stubRequest(/.*/, {
                    status: 200,
                    responseText: "OK",
                });
                const {axios: axiosInstance} = new Waas(auth);

                await assert.doesNotReject(async () => axiosInstance.get("annie"));
            });

            it("should copy the activity id from the response into the thrown error", async function() {
                const activityId = "6aac41bc-582a-49b5-819a-3e40d86b0818";
                // Of course a true WaaS error returns more properties.
                // However, we focus on the activityId to keep the test as minimal as possible.
                moxios.stubRequest(/.*/, {
                    status: 400,
                    response: {activityId},
                });
                const {axios: axiosInstance} = new Waas(auth);

                await assert.rejects(async () => axiosInstance.get(""), e => {
                    assert.ok(e instanceof GeneralError);
                    assert.strictEqual(e.activityId, activityId);
                    return true;
                });
            });

            it("should throw a NotFoundError error for 404 server response", async function() {
                moxios.stubRequest(/.*/, {
                    status: 404,
                    response: {message: "NotFoundError"},
                });
                const {axios: axiosInstance} = new Waas(auth);

                await assert.rejects(async () => axiosInstance.get("bielefeld"), NotFoundError);
            });

            it("should throw a AuthenticationError error for 401 server response", async function() {
                moxios.stubRequest(/.*/, {
                    status: 401,
                    response: {message: "AuthenticationError"},
                });
                const {axios: axiosInstance} = new Waas(auth);
                await assert.rejects(async () => axiosInstance.get("navorski"), AuthenticationError);
            });

            it("should throw a ConflictError error for 409 server response", async function() {
                moxios.stubRequest(/.*/, {
                    status: 409,
                    response: {message: "ConflictError"},
                });
                const {axios: axiosInstance} = new Waas(auth);
                await assert.rejects(async () => axiosInstance.get("ramirez"), ConflictError);
            });

            it("should throw a GeneralError for 400 server response", async function() {
                moxios.stubRequest(/.*/, {
                    status: 500,
                    response: {message: "GeneralError"},
                });
                const {axios: axiosInstance} = new Waas(auth);
                await assert.rejects(async () => axiosInstance.get("hal"), GeneralError);
            });
        });
    });

    describe("wallet", function() {
        it("should return a Wallet instance", async function() {
            const w = new Waas(auth);
            assert.ok(w.wallet() instanceof Wallet);
        });
    });

    describe("eth", function() {
        it("should return a Ethereum instance", async function() {
            const w = new Waas(auth);
            assert.ok(w.eth() instanceof Ethereum);
        });
    });

    describe("btc", function() {
        it("should return a Bitcoin instance", async function() {
            const w = new Waas(auth);
            assert.ok(w.btc() instanceof Bitcoin);
        });
    });

    describe("request", function() {
        it("should return a Request instance", function() {
            const w = new Waas(auth);
            assert.ok(w.request("71c4f385a4124239b6c968e47ea95f73") instanceof Request);
        });
    });
})
;
