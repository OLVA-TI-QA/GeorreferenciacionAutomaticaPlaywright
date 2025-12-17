# 🔍 Guía de Debug - Error 404 vs 500

## Resumen del Problema

Tu test devuelve **500 - Error deserializing object from entity stream** cuando en Postman funciona correctamente.

## Causas Posibles

### 1. **URL Base Incorrecta** ❌ (YA VERIFICADO)
- ✅ La URL base es correcta: `https://dev-olva-corp.olvacourier.com/envioRest/webresources`
- ✅ El endpoint es correcto: `/usuario/login` y `/envio/crear`
- ✅ El login funciona (200)

### 2. **Body Incompleto o Mal Formado** ⚠️ (PROBABLE)
El servidor espera TODOS estos campos en el body:

```json
{
  "parentOpti": null,
  "codigoOptitrack": 50300,
  "idRecojo": null,
  "idSede": 1,
  "idOficina": 1,
  "direccionEntrega": "string",
  "decJurada": 0,
  "decJuradaMonto": 5555,
  "cargoAjuntoCant": 0,
  "idPersJurArea": "314061",
  "consignado": "string",
  "consignadoTelf": "949078370",
  "consignadoDni": "string",
  "codExterno": "950534987",
  "idUbigeo": 150131,
  "codPostal": "string",
  "createUser": 111,
  "idTipoVia": 0,
  "idTipoZona": 0,
  "nombreVia": "0",
  "nombreZona": "0",
  "numero": "0",
  "manzana": "0",
  "lote": "0",
  "latitud": -77.0696622743156,
  "longitud": -12.042115838754475,
  "poligono": null,
  "idServicio": 35,
  "codOperador": null,
  "tipoGestion": null,
  "envioArticulo": {
    "pesoKgs": 10,
    "ancho": 42,
    "largo": 58,
    "alto": 21,
    "idContenedorArticulo": 19,
    "idArticulo": 0
  },
  "flgOficina": false,
  "idOfiDest": null,
  "montoBase": 16.25,
  "montoExceso": 63,
  "montoSeguro": 454,
  "montoIgv": 95.985,
  "precioVenta": 629.235,
  "montoEmbalaje": 0,
  "montoOtrosCostos": 0,
  "montoTransporte": 0,
  "entregaEnOficina": "0",
  "numDocSeller": "string",
  "nombreSeller": "string",
  "codigoAlmacen": "string",
  "codUbigeo": "string",
  "direccionSeller": "string",
  "referenciaSeller": "string",
  "contacto": "string",
  "telefono": "string",
  "observacion": "string",
  "nroPiezas": 10
}
```

## Pasos para Debuggear

### Paso 1: Verifica en Postman
1. Abre Postman
2. Ve a tu request de crear envío
3. Copia el body exacto que estás usando
4. Compáralo con `src/testData/archivosJson/crearEnvioBody.json`

### Paso 2: Identifica Diferencias
- ¿Hay campos que no estás enviando?
- ¿Hay campos con valores diferentes?
- ¿Hay campos extra que no debería tener?

### Paso 3: Actualiza el JSON
Si encuentras diferencias, actualiza `crearEnvioBody.json` con los valores correctos.

## Solución Recomendada

1. **Exporta el body de Postman** como JSON
2. **Reemplaza** `src/testData/archivosJson/crearEnvioBody.json` con ese JSON
3. **Ejecuta el test** nuevamente

## Comandos Útiles

```bash
# Ejecutar debug
npx tsc && node dist/debug-api.js

# Ejecutar test específico
npx playwright test tests/api/creacionTrancking/crearTrackingsLima.spec.ts

# Ver trace del error
npx playwright show-trace test-results/...
```

## Próximos Pasos

Por favor:
1. Verifica qué body estás usando en Postman
2. Compáralo con el JSON que tenemos
3. Cuéntame las diferencias

