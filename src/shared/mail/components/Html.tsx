import * as theme from './theme';

export function Html({ lang, title, children }) {
  return (
    <html lang={lang}>
      <head>
        <title>{title}</title>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontSize: theme.fontSizes.base,
          fontFamily: theme.fontFamilies.sans,
          color: theme.colors.black,
          backgroundColor: '#f6f6f6',
        }}
      >
        {children}
      </body>
    </html>
  );
}
