import * as assert from "assert";
import axios from "axios";
import {MonitorPageIterable} from "./iterables/monitor-page-iterable";
import {Monitor} from "./monitor";
import {sandbox} from "./utils/spec-helpers";
import {Waas} from "./waas";

describe("Monitor", function() {
    sandbox();

    const monitorId = "dummy-monitor-id";
    const wallet = "dummy-wallet";

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
        this.waas.wrap = (fn: any) => fn();
        this.waas.instance = this.sandbox.stub(axios, "create");
    });

    it("should construct an instance", function() {
        const monitor = new Monitor(this.waas, monitorId, wallet);
        assert.ok(monitor instanceof Monitor);
    });

    it("should not construct an instance if an argument is invalid", function() {
        assert.throws(() => new Monitor(this.waas, true as any, wallet), /Expected \?String, got Boolean/);
        assert.throws(() => new Monitor(this.waas, monitorId, 123 as any), /Expected \?String, got Number/);
        assert.throws(() => new Monitor(this.waas, true as any, 123 as any), /Expected \?String, got Boolean/);
    });

    describe("monitorId", function() {

        it("should throw an error if the property is not set", function() {
            assert.throws(() => new Monitor(this.waas).monitorId, /Expected String, got undefined/);
        });

        it("should return a string if the property is set", function() {
            const id = new Monitor(this.waas, monitorId, wallet).monitorId;
            assert.ok(typeof id === "string");
        });
    });

    describe("wallet", function() {

        it("should throw an error if the property is not set", function() {
            assert.throws(() => new Monitor(this.waas, monitorId).wallet, /Expected String, got undefined/);
        });

        it("should return a string if the property is set", function() {
            const id = new Monitor(this.waas, monitorId, wallet).wallet;
            assert.ok(typeof id === "string");
        });
    });

    describe("list", function() {

        it("should return a page-wise returning iterable", function() {
            const monitor = new Monitor(this.waas, monitorId, wallet);
            const iterable1 = monitor.list();
            assert.ok(iterable1 instanceof MonitorPageIterable);
            const iterable2 = monitor.list({});
            assert.ok(iterable2 instanceof MonitorPageIterable);
        });

    });

    describe("create", function() {

        it("should execute the API call", async function() {
            const spy = this.waas.instance.post = this.sandbox.spy();
            await new Monitor(this.waas, monitorId, wallet).create({
                description: "test monitor",
                configuration: {},
                target: "transaction",
                webhook: {
                    method: "post",
                    url: "http://test.com"
                }
            });
            assert.ok(spy.calledOnce);
            assert.ok(spy.firstCall.calledWith(`eth/wallet/${wallet}/monitors`));
        });

    });

    describe("get", function() {

        it("should execute the API call", async function() {
            const spy = this.waas.instance.get = this.sandbox.spy();
            await new Monitor(this.waas, monitorId, wallet).get();
            assert.ok(spy.calledOnce);
            assert.ok(spy.firstCall.calledWith(`eth/wallet/${wallet}/monitor/${monitorId}`));
        });

    });

    describe("update", function() {

        it("should execute the API call", async function() {
            const spy = this.waas.instance.patch = this.sandbox.spy();
            await new Monitor(this.waas, monitorId, wallet).update({description: "new description"});
            assert.ok(spy.calledOnce);
            assert.ok(spy.firstCall.calledWith(`eth/wallet/${wallet}/monitor/${monitorId}`));
        });

    });

    describe("replace", function() {

        it("should execute the API call", async function() {
            const spy = this.waas.instance.put = this.sandbox.spy();
            await new Monitor(this.waas, monitorId, wallet).replace({
                description: "replaced description",
                configuration: {},
                target: "transaction",
                webhook: {
                    method: "post",
                    url: "http://new-service.com"
                }
            });
            assert.ok(spy.calledOnce);
            assert.ok(spy.firstCall.calledWith(`eth/wallet/${wallet}/monitor/${monitorId}`));
        });

    });

    describe("delete", function() {

        it("should execute the API call", async function() {
            const spy = this.waas.instance.delete = this.sandbox.spy();
            await new Monitor(this.waas, monitorId, wallet).delete();
            assert.ok(spy.calledOnce);
            assert.ok(spy.firstCall.calledWith(`eth/wallet/${wallet}/monitor/${monitorId}`));
        });

    });

});
