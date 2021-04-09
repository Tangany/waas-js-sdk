import {IEventArgumentFilter} from "../interfaces/ethereum-contract"

// It would probably be better to extend the array type.
// However, this currently doesn't seem to work if you want to use the convenient [] object initializer then.
export class EventArgumentFilterCollection {

    constructor(private readonly filters: IEventArgumentFilter[]) {
    }

    /**
     * Assembles a URL query string to filter smart contract events based on their arguments.
     * Since axios does not accept this JavaScript-side configuration with objects, it is necessary to convert it into a URL query string compatible with WaaS.
     */
    public toQueryString(): string {
        return this.filters.reduce<string>((accumulatedQuery, filter) => {
            const {position, type, value} = filter;

            if (!(position || type || value)) {
                throw new Error("An argument filter object must define at least one criterion");
            }

            // If it is the first URL query parameter, use "?", otherwise use "&" to join multiple filters
            let s = `${accumulatedQuery === "" ? "?" : "&"}inputs`;

            // Ensure that the brackets are created to produce the form "inputs[]" even if no position is specified
            s += `[${position !== undefined ? JSON.stringify(position) : ""}]`;

            if (type) {
                s += `.${type}`;
            }
            if (value) {
                s += `=${JSON.stringify(value)}`;
            }

            return accumulatedQuery + s;
        }, "");
    }
}
