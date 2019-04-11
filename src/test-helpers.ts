import {createSandbox} from "sinon";
import * as moxios from "moxios";
import * as swagmock from "swagmock";
import * as assert from "assert";

/**
 * setup mocha test to use sandbox and moxios and tear both down after each test
 * @this {Mocha}
 */
export const mockSandbox = () => {
    beforeEach(function () {
        this.sandbox = createSandbox({
            useFakeServer: true,
        });

        moxios.install();
    });

    afterEach(function () {
        this.sandbox.restore();
        moxios.uninstall();
    });
};

/**
 * @typedef {path:string,operation:string, response:number } MockOpenApiRes
 * @property path - api path
 * @property operation - crud operation
 * @property response - http response code to mock
 * @property delay - response time of the mock server
 * @property useExamples - return openapi examples as mocked server results
 */

/**
 * queue a moxios response for given openapi operation
 * @param openapi - openapi json file path
 * @return {MockOpenApiRes} response function
 */
export const queueOpenApiResponse = (openapi: string) => {
    const mockgen = swagmock(openapi);

    return async ({path, operation, response = 200, delay = 20, useExamples = false}: { path: string, operation: string, response: number, delay?: number, useExamples?: boolean }) => {
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
