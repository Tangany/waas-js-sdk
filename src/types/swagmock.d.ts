// tslint:disable-next-line:no-namespace
declare namespace swagmock {
    interface ISwagmock {
        responses(options: { [name: string]: any }): Promise<IResponses>;
    }

    interface IResponses {
        responses: [];
    }
}

declare function swagmock(api: string): swagmock.ISwagmock;

export = swagmock;
