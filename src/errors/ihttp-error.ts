export interface IHttpError extends Error {
    readonly status: number;
}
