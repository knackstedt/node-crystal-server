
export type CrystalAsset = {
    id: number;
    error: unknown;
    metadata: {
        http_version: number, // probably 11 20 30?
        status_code: number,
        reason_phrase: string,
        headers: [string, string][]
    };
    request_cookie: unknown; // string?
    url: string,

    host: string,
    path: string,
    query: string,
    hash: string,
    port: string,
}