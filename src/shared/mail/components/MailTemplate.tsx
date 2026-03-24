import type { ReactNode } from 'react';

import { Html } from './Html';
import { colors, sizes } from './theme';
import { Paragraph } from './Paragraph';
import { NestedTable } from './NestedTable';
import { LineSeparator } from './LineSeparator';

type MailTemplateProps = {
  title: string;
  children: ReactNode;
  logoUrl?: string;
  logoAlt?: string;
};

export function MailTemplate({
  title,
  children,
  logoUrl = '/assets/logo-color.png',
  logoAlt = 'Sistema de Créditos',
}: MailTemplateProps) {
  return (
    <Html title={title}>
      <table
        align="center"
        cellPadding={0}
        cellSpacing={0}
        width="100%"
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          maxWidth: sizes.mailWidth,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <tr
          style={{
            alignContent: 'center',
            padding: '16px 24px',
            backgroundColor: colors.lightBlue,
          }}
        >
          <td style={{ backgroundColor: colors.lightBlue, width: '70px' }}>
            <div
              style={{
                paddingTop: '12px',
                width: '100%',
                float: 'left',
                textAlign: 'center',
              }}
            >
              <img
                src={logoUrl}
                alt={logoAlt}
                width="55"
                height="55"
              />
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <NestedTable
              bgcolor={colors.white}
              width="100%"
              style={{
                padding: 32,
                width: '100%',
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              }}
            >
              <Paragraph fontSize={18} fontWeight="bold">
                {title}
              </Paragraph>
              <LineSeparator paddingTop={8} />
              {children}
            </NestedTable>
          </td>
        </tr>
        <tr>
          <td style={{ padding: '0px 24px 16px 24px' }}></td>
        </tr>
      </table>
    </Html>
  );
}
