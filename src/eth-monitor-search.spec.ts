import * as assert from "assert";
import {EthMonitorSearch} from "./eth-monitor-search"
import {MonitorIterable} from "./iterables/auto-pagination/monitor-iterable"
import {MonitorPageIterable} from "./iterables/pagewise/monitor-page-iterable"
import {sandbox} from "./utils/spec-helpers";

sandbox();

describe("EthMonitorSearch", function() {

    describe("list", function() {

        it("should return a page-wise returning iterable if the autoPagination option is not enabled", function() {
            const ethMonitorSearch = new EthMonitorSearch(this.waas);
            const iterable1 = ethMonitorSearch.list({});
            assert.ok(iterable1 instanceof MonitorPageIterable);
            const iterable2 = ethMonitorSearch.list({}, {});
            assert.ok(iterable2 instanceof MonitorPageIterable);
            const iterable3 = ethMonitorSearch.list({}, {autoPagination: false});
            assert.ok(iterable3 instanceof MonitorPageIterable);
        });

        it("should return an item-wise returning iterable if the autoPagination option is enabled", function() {
            const iterable = new EthMonitorSearch(this.waas).list({}, {autoPagination: true});
            assert.ok(iterable instanceof MonitorIterable);
        });

    });

});
