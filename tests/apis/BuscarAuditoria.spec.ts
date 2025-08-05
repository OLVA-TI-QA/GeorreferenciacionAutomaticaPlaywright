import { test, expect, request, APIRequestContext } from '@playwright/test';
import { environment } from '../../src/config/environment';
import fileData from '../../src/testData/ParametroBuscar.json';

let baseUrl: APIRequestContext;
// Setup de baseURL before all test
test.beforeEach(async () => {
    baseUrl = await request.newContext({
        baseURL: environment.baseurlcorp,
    })
});

test('Buscar auditoria', async () => {
    const getResponse = await baseUrl.get('/api/v1/guia-despacho/auditoria', {
        params: {
            tipoGeneracion: 1,
            idGuiaDespachos: 889905,
        }
    });
    expect(getResponse.status()).toBe(200);
    console.log(await getResponse.json());
})

test('Buscar auditoria con json', async () => {
    const getResponse = await baseUrl.get('/api/v1/guia-despacho/auditoria', {
        params: {
            tipoGeneracion: fileData.tipoGeneracion,
            idGuiaDespachos: fileData.idGuiaDespachos,
        }
    });
    expect(getResponse.status()).toBe(200);
    console.log(await getResponse.json());
})
