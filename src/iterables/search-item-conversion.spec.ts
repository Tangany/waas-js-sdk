import * as assert from "assert";
import {EthTransactionEvent} from "../eth-transaction-event";
import {IEventSearchResponse} from "../interfaces/ethereum-contract"
import {IMonitorSearchResponse} from "../interfaces/monitor";
import {Monitor} from "../monitor";
import {sandbox} from "../utils/spec-helpers";
import {Waas} from "../waas";
import {convertToEthEvent, convertToMonitor, findHateoasGetLink} from "./search-item-conversion";

sandbox();

describe("SearchItemConversion", function() {

    beforeEach(function() {
        this.waas = this.sandbox.createStubInstance(Waas);
    });

    describe("convertToMonitor", function() {

        it("should return a monitor object for a valid argument", function() {
            const monitorId = "fake-monitor-id";
            const wallet = "my-wallet";
            const item: IMonitorSearchResponse["list"][0] = {
                monitor: monitorId,
                description: "test description",
                links: [{
                    rel: "monitor",
                    type: "GET",
                    href: `/eth/wallet/${wallet}/monitor/${monitorId}`
                }]
            }
            const monitor = convertToMonitor(item, this.waas);
            assert.ok(monitor instanceof Monitor);
            assert.strictEqual(monitor.monitorId, monitorId);
            assert.strictEqual(monitor.wallet, wallet);
        });

        it("should fail if the link does not match the expected format", function() {
            const item: IMonitorSearchResponse["list"][0] = {
                monitor: "test-monitor",
                description: "test description",
                links: [{
                    type: "GET",
                    rel: "monitor",
                    href: "eth/xyz/my-wallet/monitor/12345"
                }]
            }
            assert.throws(() => convertToMonitor(item, this.waas), /Could not find out the wallet name of the monitor/);
        });

    });

    describe("convertToEthEvent", function() {

        it("should return an event object for a valid argument", function() {
            const eventName = "Transfer";
            const hash = "fake-hash";
            const eventIndex = 10;
            const item: IEventSearchResponse["list"][0] = {
                event: eventName,
                links: [{type: "GET", rel: "event", href: `/eth/transaction/${hash}/event/${eventIndex}`}]
            }
            const event = convertToEthEvent(item, this.waas);
            assert.ok(event instanceof EthTransactionEvent);
            assert.strictEqual(event.name, eventName);
            assert.strictEqual(event.index, eventIndex);
            assert.strictEqual(event.hash, hash);
        });

        it("should fail if the link does not match the expected format", function() {
            const item: IEventSearchResponse["list"][0] = {
                event: "dummy",
                links: [{type: "GET", rel: "event", href: "/xyz/tx/12345/event/12"}]
            }
            assert.throws(() => convertToEthEvent(item, this.waas), /Could not find out the relevant information for the transaction event/);
        });

    });

    describe("findHateoasGetLink", function() {

        it("should fail if there is no appropriate HATEOAS link", function() {
            assert.throws(() => findHateoasGetLink([], "my-relation"), /A URL for a GET request for further information was expected, but none was found/);
            const links = [
                {type: "POST", rel: "monitor", href: "dummy"},
                {type: "DELETE", rel: "monitor", href: "fake"}
            ];
            assert.throws(() => findHateoasGetLink(links, "my-relation"), /A URL for a GET request for further information was expected, but none was found/);
        });

        it("should fail if there is no link to the desired resource", function() {
            const links = [{type: "GET", rel: "my-relation", href: "dummy"}];
            assert.throws(() => findHateoasGetLink(links, "another-relation"), /A URL for a GET request for further information was expected, but none was found/);
        });

    });

});
