import * as assert from "assert";
import {EventArgumentFilterCollection} from "./event-argument-filter-collection";
import {sandbox} from "./spec-helpers";

describe("EventArgumentFilterCollection", function() {

    sandbox();

    describe("toQueryString", function() {

        it("should return an empty string for an empty argument array", function() {
            const filters = new EventArgumentFilterCollection([]);
            assert.strictEqual(filters.toQueryString(), "");
        });

        it("should throw an error if no property is set", function() {
            // Since all properties are optional, you are not forced to set at least one.
            const filters = new EventArgumentFilterCollection([{}]);
            assert.throws(() => filters.toQueryString(), /An argument filter object must define at least one criterion/);
        });

        it("should concatenate filters after the first one with &", function() {
            const filters = new EventArgumentFilterCollection([
                {position: 0, value: "foo"},
                {position: "my-arg", value: "bar"},
                {position: "another-arg", value: true},
            ]);
            assert.strictEqual(filters.toQueryString(), "?inputs[0]=\"foo\"&inputs[\"my-arg\"]=\"bar\"&inputs[\"another-arg\"]=true");
        });

        it("should generate brackets even if no position is specified", function() {
            const result = new EventArgumentFilterCollection([{type: "bool"}]).toQueryString();
            assert.ok(/inputs\[]/.test(result));
        });

        it("should not generate quotes around the numeric position of an argument", function() {
            const result = new EventArgumentFilterCollection([{position: 2, value: "foo"}]).toQueryString();
            assert.ok(!/inputs\[".*"]/.test(result));
        });

        it("should generate quotes around argument names", function() {
            const result = new EventArgumentFilterCollection([{position: "my-arg", value: "baz"}]).toQueryString();
            assert.ok(/inputs\["my-arg"]/.test(result));
        });

    });

});
