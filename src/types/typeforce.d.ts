// tslint:disable-next-line:no-namespace
declare namespace typeforce {
    interface ITypeforce {
        (type: any, value: any, strict?: boolean, surrogate?: any): void;

        compile(type: object): object;

        anyOf(...types: string[]): object;
    }
}
declare const typeforce: typeforce.ITypeforce;
export = typeforce;
