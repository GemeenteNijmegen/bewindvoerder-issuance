import { ApiGatewayV2Response, Response } from '@gemeentenijmegen/apigateway-http';

/**
 * Response.html() zet geen charset op de Content-type header. Zonder charset raadt de browser er
 * een, wat diakrieten (Çağla, etc.) corrumpeert. UTF-8 hier expliciet vastzetten.
 */
export function htmlResponse(body: string, code = 200, cookies?: string[] | string): ApiGatewayV2Response {
  const response = Response.html(body, code, cookies);
  response.headers = { ...response.headers, 'Content-type': 'text/html; charset=utf-8' };
  return response;
}
