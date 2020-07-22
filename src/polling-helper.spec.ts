import * as assert from "assert";
import {poll} from "./polling-helper"
import {sandbox} from "./spec-helpers"

sandbox();

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
            const fn = this.sandbox.spy(createApiStub());
            const condition = (r: number) => r === 2;
            const result = await poll(fn, condition, "sample request", 1e3, 2);
            assert.strictEqual(result, 2);
            assert(fn.calledTwice); // assert the polling attempts
        });

        it("should time out if the passed threshold is exceeded", async function() {
            const fn = this.sandbox.spy();
            const p = async () => poll(fn, () => false, "sample request", 10e3, 1e3);
            const timeout = this.sandbox.useFakeTimers({toFake: ["setTimeout"]}); // fake the timer
            this.sandbox.useFakeTimers({toFake: ["setInterval"]}); // stop the interval

            await Promise.all([
                assert.rejects(async () => p(), /Timeout when retrieving information for sample request/),
                timeout.tick(10e3), // advance the timer to fake the timeout
            ])
        });

        it("should reject if the polling function throws an error", async function() {
            const fn = this.sandbox.spy(() => new Promise<any>((resolve, reject) => reject(new Error("Some error"))));
            const interval = this.sandbox.useFakeTimers({toFake: ["setInterval"]}); // stop the interval
            const p = async () => poll(fn, () => true, "sample request", 10e3, 1e3);
            await Promise.all([
                assert.rejects(p, /Error: Some error/),
                interval.next(), // fire the first interval without actually waiting for the pollingInterval timer
            ]);
            assert(fn.calledOnce); // make sure the function did not run after the first rejection
        });

        it("should clear timers if some interval function rejects", async function() {
            const timers = this.sandbox.useFakeTimers(); // fake all timers
            const timeoutSpy = this.sandbox.spy(timers, "clearTimeout");
            const intervalSpy = this.sandbox.spy(timers, "clearInterval");
            const p = async () => poll(async () => Promise.reject("Pardon"), () => true, "sample request", 10e3, 1e3);
            await Promise.all([
                assert.rejects(p, /Pardon/),
                timers.next(), // advance the interval
            ]);
            assert(timeoutSpy.calledOnce);
            assert(intervalSpy.calledOnce);
        });
    });

})
