import designTokens from '@gemeentenijmegen/design-tokens/dist/index.css';
import semanticHtml from '@gemeentenijmegen/semantic-html/dist/index.css';
import alertCss from '@utrecht/alert-css/dist/index.css';
import buttonCss from '@utrecht/button-css/dist/index.css';
import documentCss from '@utrecht/document-css/dist/index.css';
import heading1Css from '@utrecht/heading-1-css/dist/index.css';
import heading2Css from '@utrecht/heading-2-css/dist/index.css';
import heading3Css from '@utrecht/heading-3-css/dist/index.css';
import linkCss from '@utrecht/link-css/dist/index.css';
import pageBodyCss from '@utrecht/page-body-css/dist/index.css';
import paragraphCss from '@utrecht/paragraph-css/dist/index.css';
import appCss from './app.css';

export const bundledCss = [
  designTokens,
  semanticHtml,
  documentCss,
  pageBodyCss,
  heading1Css,
  heading2Css,
  heading3Css,
  paragraphCss,
  buttonCss,
  linkCss,
  alertCss,
  appCss,
].join('\n');
