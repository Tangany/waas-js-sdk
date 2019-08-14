import {createSandbox} from "sinon";
import * as t from "typeforce";

/**
 * setup mocha to use sandbox on each test. Tear down and reinitialise the sandbox after each suite.
 * @deprecated use for testing only
 */
export const sandbox = () => {
    beforeEach(function() {
        this.sandbox = createSandbox({});

    });

    afterEach(function() {
        this.sandbox.restore();
    });
};

export const recipientType = t.compile({
    to: "String",
    amount: "String",
});
