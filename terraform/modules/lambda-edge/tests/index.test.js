/**
 * Pruebas unitarias del handler de Lambda@Edge (origin-response).
 *
 * Ejecutar sin dependencias externas:
 *
 *   node --test terraform/modules/lambda-edge/tests/index.test.js
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const { handler } = require('../src/index.js');

/**
 * Encabezados esperados (clave en minusculas -> valor).
 */
const SECURITY_HEADERS = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'self'; object-src 'none'; base-uri 'self'",
};

/**
 * Construye un evento origin-response de CloudFront.
 *
 * @param {Object} previousHeaders - Mapa de encabezados previos (nombre en minusculas -> lista de {key, value}).
 * @returns {Object}
 */
function buildEvent(previousHeaders = {}) {
  return {
    Records: [
      {
        cf: {
          request: {},
          response: {
            status: '200',
            statusDescription: 'OK',
            body: '<html><body>hola</body></html>',
            headers: previousHeaders,
          },
        },
      },
    ],
  };
}

/**
 * Ejecuta el handler y devuelve la respuesta capturada por el callback.
 *
 * @param {Object} event
 * @returns {Object} respuesta de CloudFront
 */
function invoke(event) {
  let capturedResponse;
  let capturedError;
  handler(
    event,
    {},
    (err, response) => {
      capturedError = err;
      capturedResponse = response;
    },
  );
  assert.ifError(capturedError);
  return capturedResponse;
}

function headerNames(response) {
  return Object.keys(response.headers).map((k) => k.toLowerCase());
}

function headerValues(response, name) {
  const key = name.toLowerCase();
  return (response.headers[key] || []).map((h) => h.value);
}

function headerKeys(response, name) {
  const key = name.toLowerCase();
  return (response.headers[key] || []).map((h) => h.key);
}

test('agrega los cuatro encabezados de seguridad', (t) => {
  const response = invoke(buildEvent({}));
  const names = headerNames(response);
  for (const name of Object.keys(SECURITY_HEADERS)) {
    assert.ok(names.includes(name), `falta el encabezado ${name}`);
  }
});

test('usa la capitalizacion esperada de los nombres de encabezado', (t) => {
  const response = invoke(buildEvent({}));
  const keys = Object.keys(response.headers).flatMap((k) =>
    (response.headers[k] || []).map((h) => h.key),
  );
  assert.ok(keys.includes('Strict-Transport-Security'));
  assert.ok(keys.includes('X-Content-Type-Options'));
  assert.ok(keys.includes('X-Frame-Options'));
  assert.ok(keys.includes('Content-Security-Policy'));
});

test('los valores de los encabezados son correctos', (t) => {
  const response = invoke(buildEvent({}));
  assert.strictEqual(
    headerValues(response, 'Strict-Transport-Security')[0],
    'max-age=63072000; includeSubDomains; preload',
  );
  assert.strictEqual(
    headerValues(response, 'X-Content-Type-Options')[0],
    'nosniff',
  );
  assert.strictEqual(headerValues(response, 'X-Frame-Options')[0], 'DENY');
  assert.strictEqual(
    headerValues(response, 'Content-Security-Policy')[0],
    "default-src 'self'; object-src 'none'; base-uri 'self'",
  );
});

test('conserva el status code original', (t) => {
  const response = invoke(buildEvent({}));
  assert.strictEqual(response.status, '200');
  assert.strictEqual(response.statusDescription, 'OK');
});

test('conserva el body original', (t) => {
  const response = invoke(buildEvent({}));
  assert.strictEqual(response.body, '<html><body>hola</body></html>');
});

test('no genera encabezados duplicados si ya existian', (t) => {
  const previous = {
    'strict-transport-security': [
      { key: 'Strict-Transport-Security', value: 'max-age=120' },
      { key: 'strict-transport-security', value: 'max-age=60' },
    ],
  };
  const response = invoke(buildEvent(previous));
  const values = headerValues(response, 'Strict-Transport-Security');
  assert.strictEqual(values.length, 1);
  assert.strictEqual(values[0], 'max-age=63072000; includeSubDomains; preload');
});

test('funciona con una respuesta sin encabezados previos', (t) => {
  const response = invoke(buildEvent({}));
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    assert.strictEqual(headerValues(response, name)[0], value);
  }
});

test('funciona con una respuesta que ya contiene headers', (t) => {
  const previous = {
    'cache-control': [{ key: 'Cache-Control', value: 'max-age=3600' }],
    'content-type': [{ key: 'Content-Type', value: 'text/html; charset=utf-8' }],
  };
  const response = invoke(buildEvent(previous));
  assert.strictEqual(headerValues(response, 'Cache-Control')[0], 'max-age=3600');
  assert.strictEqual(
    headerValues(response, 'Content-Type')[0],
    'text/html; charset=utf-8',
  );
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    assert.strictEqual(headerValues(response, name)[0], value);
  }
});
