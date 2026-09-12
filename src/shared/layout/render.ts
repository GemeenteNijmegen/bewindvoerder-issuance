import Mustache from 'mustache';
import beeldmerk from './beeldmerk.mustache';
import eherkenning from './eherkenning.mustache';
import footer from './footer.mustache';
import header from './header.mustache';
import { bundledCss } from '../styles/bundledCss';

const partials = { header, footer, beeldmerk, eherkenning };

export function render(template: string, data: Record<string, unknown> = {}): string {
  return Mustache.render(template, {
    inlineCss: bundledCss,
    currentYear: new Date().getFullYear(),
    ...data,
  }, partials);
}
