import * as assert from "assert";
import {poll} from "./polling-helper"

describe("PollingHelper", function() {

    function createApiStub() {
        let counter = 0;
        return async () => {
            counter++;
            return counter;
        }
    }

    describe("poll", function() {

        it("should resolve for the expected value", async function() {
            const fn = createApiStub();
            const condition = (r: number) => r === 2;
            const result = await poll(fn, condition, "sample request", 100, 2);
            assert.strictEqual(result, 2);
        });

        it("should time out if the passed threshold is exceeded", async function() {
            const fn = createApiStub();
            const condition = (r: number) => r === 10;
            await assert.rejects(() => poll(fn, condition, "sample request", 6, 2));
        });

        it("should reject if the polling function throws an error", async function() {
            const fn = () => new Promise<any>((resolve, reject) => reject(new Error("Some error")));
            const condition = () => true;
            await assert.rejects(() => poll(fn, condition, "sample request", 100, 20));
        })

    });

})
