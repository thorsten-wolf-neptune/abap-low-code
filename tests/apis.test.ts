import axios, {AxiosRequestConfig, AxiosResponse, Method} from 'axios';
import * as https from 'https';

https.globalAgent.options.rejectUnauthorized = false;

type ApiTestOperation = {
    apiId: string;
    name: string;
    method: string;
    endpoint: string;
    path: string;
    type: string;
    data: any;
    headers: any;
    parameters: any;
    statusCode: number;
    jestMaxRuntime: number;
    jestMatchOperation: string;
    jestMatchName: string;
    jestMatchValue: string;
}

function findValue(response: AxiosResponse, path) {
    if (!path) {
        path = 'data';
    }
    const paths = path.split('.');
    let finalValue = response;

    for (let i = 1; i < paths.length; i++) {
        if (!finalValue[paths[i]]) return undefined;
        finalValue = finalValue[paths[i]];
    }
    return finalValue;
}

const servers = (process.env.P9_SERVER_URL && process.env.P9_SERVER_TOKEN)
    ? [{url: process.env.P9_SERVER_URL, token: process.env.P9_SERVER_TOKEN}]
    : JSON.parse(`[{"url":"https://planet9dev.neptune-software.com:8081","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVmMjE0MDhmLWY4NjEtNDkxOC1iNjg3LTM3M2Q3ZjA4OGY3NyIsInV1aWQiOiJmYWI3ZDFjMS05NGIwLTQxY2YtYWEyZi1lYWFhODU4NmZmNjEiLCJpYXQiOjE2NDY5ODg0MjUsImV4cCI6MTY1NTYyODQyNX0.OOPnFfQUlRSE5K0_Im7j5B7PdQvFkhuwkufrm0DMmrU"}]`);

const apiOperationsToTest: ApiTestOperation[] = JSON.parse('[{"apiId":"6aef0969-cb0f-4da7-b05a-8c0051f4a629","name":"Calculate 2 + 2 ","endpoint":"/public/serverscript/calculator","method":"POST","path":"/addNumbers","type":"script","data":{"result":4},"headers":{},"parameters":{},"statusCode":"","jestMaxRuntime":null,"jestMatchName":"req.data","jestMatchOperation":"toBe","jestMatchValue":""}]');

for (let server of servers) {
    for (let operationToTest of apiOperationsToTest) {
        describe(operationToTest.name, () => {
            test(`${operationToTest.method} ${operationToTest.path}`, async () => {
                const runtimeStart = new Date().getTime();

                const parameterKeys = Object.keys(operationToTest.parameters);
                const parameters = parameterKeys.length > 0
                    ? `?${parameterKeys.map(key => `${key}=${operationToTest.parameters[key]}`).join('&')}`
                    : undefined
                const endpoint = `${operationToTest.type ? server.url : ''}${operationToTest.endpoint}${operationToTest.path}${parameters ? parameters : ''}`;
                const url = !operationToTest.type ? `${server.url}/proxy/${encodeURIComponent(endpoint)}/${operationToTest.apiId}` : endpoint;

                const opts: AxiosRequestConfig = {
                    method: operationToTest.method as Method,
                    url,
                    ...(operationToTest.data && {data: operationToTest.data}),
                    headers: {
                        "Authorization": `Bearer ${server.token}`,
                        ...operationToTest.headers
                    },
                    ...(operationToTest.data && {data: operationToTest.data})
                };

                const response = await axios(opts);

                const runtimeEnd = new Date().getTime();
                const runtime = runtimeEnd - runtimeStart;
                if (operationToTest.statusCode) {
                    expect(response.status).toBe(+operationToTest.statusCode);
                }

                if (operationToTest.jestMaxRuntime) {
                    expect(runtime).toBeLessThan(operationToTest.jestMaxRuntime);
                }

                if (operationToTest.jestMatchName && operationToTest.jestMatchValue) {
                    expect(findValue(response, operationToTest.jestMatchName))[operationToTest.jestMatchOperation](operationToTest.jestMatchValue);
                }
            });
        });
    }
}
