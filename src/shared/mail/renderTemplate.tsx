import { renderToStaticMarkup } from 'react-dom/server';

export function renderTemplate<T = { data: any }>(
  TemplateToUse: any,
  props: T,
) {
  return renderToStaticMarkup(<TemplateToUse {...props} />);
}
