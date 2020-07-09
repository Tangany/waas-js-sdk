import {TimeoutError} from "./errors";

/**
 * Executes the passed function until the defined result occurs or the timeout is exceeded.
 * @param fn - Function that executes the polling logic (for example, an API call)
 * @param validationFn - Function that defines which result of a polling call should lead to the end of polling
 * @param description - Summary of the polling activity for the error message on timeout (e.g. "request 12345")
 * @param timeout - Limit value after which polling is aborted (in ms)
 * @param pollingInterval - Delay between the individual polling calls (in ms)
 */
export async function poll<T>(fn: () => Promise<T>, validationFn: (result: T) => boolean, description: string, timeout: number, pollingInterval: number) {
    // We need a timeout that stops polling when the defined threshold is exceeded. Thus there must be a callback in which
    // a TimeoutError is to be thrown. So it is not enough that async methods automatically create a promise based on
    // the return and throw statements. A throw in such a callback would not reject the promise and instead lead to an unhandled rejection.
    // Therefore we create our own promise and consciously call resolve/reject.
    return new Promise<T>(async (resolve, reject) => {
        const globalTimeout = setTimeout(() => {
            // If the global timeout expires before the expected result has been obtained by polling, it is very important
            // to clear the polling interval manually. Otherwise the process will not terminate.
            clearInterval(intervalTimer);
            return reject(new TimeoutError(`Timeout when retrieving information for ${description}`));
        }, timeout);
        const intervalTimer = setInterval(async () => {
            try {
                const response = await fn();
                if (validationFn(response)) {
                    // If the global timeout has not been exceeded, it must be cleared manually to prevent a non-terminating process.
                    clearTimeout(globalTimeout);
                    // Despite the return statement, it seems that the interval must also be clarified manually to avoid further iterations.
                    clearInterval(intervalTimer);
                    return resolve(response);
                }
            } catch (e) {
                return reject(e);
            }
        }, pollingInterval);
    });
}
