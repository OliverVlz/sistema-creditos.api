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
            backgroundColor: '#FF8546',
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
              backgroundColor: '#FF8546',
              borderRadius: 5,
              boxSizing: 'border-box',
              cursor: 'pointer',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 'bold',
              margin: 0,
              padding: '11px 24px',
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </tbody>
  );
}
