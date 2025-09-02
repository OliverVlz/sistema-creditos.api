import { colors, fontSizes, fontFamilies } from './theme';

export function ButtonLink({ href = '#', children }) {
  return (
    <tbody>
      <tr>
        <td
          style={{
            fontFamily: fontFamilies.sans,
            fontSize: fontSizes.base,
            verticalAlign: 'top',
            backgroundColor: colors.darkBlue,
            borderRadius: 5,
            textAlign: 'center',
          }}
        >
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              display: 'inline-block',
              color: '#ffffff',
              backgroundColor: colors.darkBlue,
              borderRadius: 5,
              boxSizing: 'border-box',
              cursor: 'pointer',
              textDecoration: 'none',
              fontSize: fontSizes.base,
              fontWeight: 'bold',
              margin: 0,
              padding: '15px 32px',
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </tbody>
  );
}
