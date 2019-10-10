import axios, {AxiosInstance} from "axios";
import Bottleneck from "bottleneck";
import {sandbox} from "./spec-helpers";
import {WaasAxiosInstance} from "./waas-axios-instance";
import * as assert from "assert";

sandbox();

describe("WaasAxiosInstance", function() {
    describe("wrap", function() {
        it.skip("should fail executing unwrapped methods", async function() { // todo
            const stub = this.sandbox.stub(axios, "get");
            class A extends WaasAxiosInstance {
                constructor(axiosInstance: AxiosInstance) {
                    super(axiosInstance);
                }

                public async some() {
                    return this.instance.get("");
                }
            }

            const a = new A(axios);
            a.limiter = new Bottleneck();

            await assert.rejects(async () => a.some());
            assert.strictEqual(stub.callCount, 1);
        });
    });
});
