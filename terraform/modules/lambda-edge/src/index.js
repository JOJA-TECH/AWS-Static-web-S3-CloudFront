/**
 * Lambda@Edge - origin-response
 *
 * Agrega o reemplaza encabezados de seguridad HTTP en las respuestas de
 * CloudFront. Se ejecuta en el evento origin-response.
 *
 * Evento: event.Records[0].cf.response
 * Runtime: Node.js (CommonJS)
 */

'use strict';

/**
 * Encabezados de seguridad que se agregan o reemplazan en cada respuesta.
 * La CSP se arma en cada invocacion con los origenes de las variables de
 * entorno API_DOMAIN y UPLOAD_DOMAIN.
 */
const SECURITY_HEADERS = {
  'Strict-Transport-Security':
    'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function contentSecurityPolicy() {
  const sources = ['\'self\'', process.env.API_DOMAIN, process.env.UPLOAD_DOMAIN]
    .filter(Boolean)
    .join(' ');
  return `default-src 'self'; object-src 'none'; base-uri 'self'; connect-src ${sources}`;
}

/**
 * Establece un encabezado en el mapa de encabezados de CloudFront, evitando
 * duplicados. Los nombres de encabezado conservan la capitalización canónica
 * esperada (p. ej. Strict-Transport-Security).
 *
 * @param {Object} headers - Mapa de encabezados de CloudFront (nombre en minusculas -> lista de {key, value}).
 * @param {string} name - Nombre canonico del encabezado.
 * @param {string} value - Valor del encabezado.
 */
function setHeader(headers, name, value) {
  const keyLower = name.toLowerCase();
  const entry = { key: name, value: value };

  // Si el encabezado ya existe (cualquier capitalizacion), se reemplaza por
  // un unico valor para evitar duplicados.
  if (headers[keyLower]) {
    headers[keyLower] = [entry];
    return;
  }

  headers[keyLower] = [entry];
}

exports.handler = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const response = event.Records[0].cf.response;

  // Conservar status code, statusDescription, body y encabezados existentes.
  const headers = response.headers;

  // Agregar o reemplazar los cuatro encabezados de seguridad.
  Object.keys(SECURITY_HEADERS).forEach((name) => {
    setHeader(headers, name, SECURITY_HEADERS[name]);
  });
  setHeader(headers, 'Content-Security-Policy', contentSecurityPolicy());

  // Devolver la respuesta conservando todo lo demas.
  callback(null, response);
};
