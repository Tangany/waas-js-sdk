import {createSandbox} from "sinon";
import * as moxios from "moxios";
import * as swagmock from "swagmock";
import * as assert from "assert";

/**
 * setup mocha test to use sandbox and moxios and tear both down after each test
 */
export const mockSandbox = () => {
    beforeEach(function() {
        this.sandbox = createSandbox({
            useFakeServer: true,
        });

        moxios.install();
    });

    afterEach(function() {
        this.sandbox.restore();
        moxios.uninstall();
    });
};

/**
 * @param path - api path
 * @param operation - crud operation
 * @param response - http response code to mock
 * @param delay - response time of the mock server
 * @param useExamples - return openapi examples as mocked server results
 */
interface IMockOpenApiRes {
    path: string;
    operation: string;
    response: number;
    delay?: number;
    useExamples?: boolean;
}

/**
 * queue a moxios response for given openapi operation
 * @param openapi - openapi json file path
 */
export const queueOpenApiResponse = (openapi: string) => {
    const mockgen = swagmock(openapi);

    return async ({path, operation, response = 200, delay = 20, useExamples = false}: IMockOpenApiRes) => {

        const {responses} = await mockgen.responses({
            path,
            operation,
            response,
            useExamples,
        });

        assert.ok(responses, "no response for openapi specification");
        assert.ok(!Array.isArray(responses), `received multiple responses: ${JSON.stringify(responses)}`);

        moxios.wait(() =>
            moxios.requests.mostRecent()
                .respondWith({
                    status: response,
                    response: responses,
                }), delay);
    };
};
