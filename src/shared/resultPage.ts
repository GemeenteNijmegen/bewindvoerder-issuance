import { ApiGatewayV2Response } from '@gemeentenijmegen/apigateway-http';
import { htmlResponse } from './html';
import { render } from './layout/render';
import resultTemplate from './result.mustache';

export function resultPage(title: string, message: string, code = 200): ApiGatewayV2Response {
  const html = render(resultTemplate, { title, message });
  return htmlResponse(html, code);
}
