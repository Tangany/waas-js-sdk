export abstract class HttpError extends Error {
    protected constructor(name: string, public readonly status: number, public readonly activityId?: string) {
        super(name);
    }
}
