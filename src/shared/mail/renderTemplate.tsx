import { renderToStaticMarkup } from 'react-dom/server';

import { Language } from 'src/shared/enums';

export function renderTemplate<T = { lang?: Language; data: any }>(
  TemplateToUse: any,
  props: T,
) {
  return renderToStaticMarkup(<TemplateToUse {...props} />);
}
