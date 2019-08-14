export abstract class HttpError extends Error {
    protected constructor(name: string, public readonly status: number) {
        super(name);
    }
}
