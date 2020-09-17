import * as assert from "assert";
// import axios from "axios"
import * as moxios from "moxios";
import {IContractCall} from "../interfaces";
import {sandbox} from "./spec-helpers";
import {Waas} from "../waas";
// import {Waas} from "../waas";
import {callContractFunction} from "./eth-contract-call";

sandbox();

describe("EthContractCall", function() {

    const sampleTokenAddress = "0xC32AE45504Ee9482db99CfA21066A59E877Bc0e6";
    const sampleCallConfig: IContractCall = {
        function: "foo(uint256)",
        inputs: [42],
        outputs: ["string"]
    };

    beforeEach(function() {
        moxios.install();
        this.waas = this.sandbox.createStubInstance(Waas);
    });

    afterEach(function() {
        moxios.uninstall();
    });

    it("should return a function", function() {
        const fn = callContractFunction(this.waas, sampleTokenAddress);
        assert.ok(typeof fn === "function");
    });

    it("should reject if a configuration object and the second parameter is used", async function() {
        await assert.rejects(
            () => callContractFunction(this.waas, sampleTokenAddress)(sampleCallConfig, ["string"]),
            /second parameter is not allowed/)
    });

    it("should perform a POST request if a configuration object is used", async function() {
        const list = ["foo"];

        moxios.stubRequest(/.*/, {
            status: 200,
            response: {list}
        });

        const waas = new Waas({clientId: "...", clientSecret: "...", subscription: "..."});
        const spy = this.sandbox.spy(waas.instance, "post");
        const result = await callContractFunction(waas, sampleTokenAddress)(sampleCallConfig);

        assert.ok(spy.calledOnce);
        assert.deepStrictEqual(result, list);
    });

    it("should perform a GET request if the shorthand parameters are used", async function() {
        const list = ["foo"];

        moxios.stubRequest(/.*/, {
            status: 200,
            response: {list}
        });

        const waas = new Waas({clientId: "...", clientSecret: "...", subscription: "..."});
        const spy = this.sandbox.spy(waas.instance, "get");
        const result = await callContractFunction(waas, sampleTokenAddress)("myFn()", ["string"]);

        assert.ok(spy.calledOnce);
        assert.deepStrictEqual(result, list);
    });

    it("should consider the optional wallet parameter", async function() {
        const list = ["foo"];
        // Stub only requests with the wallet name inside
        moxios.stubRequest(/my-wallet/, {
            status: 200,
            response: {list}
        });
        const waas = new Waas({clientId: "...", clientSecret: "...", subscription: "..."});
        const result = await callContractFunction(waas, sampleTokenAddress, "my-wallet")(sampleCallConfig);
        assert.deepStrictEqual(result, list);
    });

});
