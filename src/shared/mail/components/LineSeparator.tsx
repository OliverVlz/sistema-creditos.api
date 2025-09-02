import { colors } from './theme';

export function LineSeparator({
  paddingBottom,
  paddingTop,
}: {
  paddingBottom?: string | number;
  paddingTop?: string | number;
}) {
  return (
    <tr>
      <td>
        <table
          style={{ paddingBottom, paddingTop }}
          border={0}
          cellPadding={0}
          cellSpacing={0}
          width="100%"
        >
          <tr>
            <td
              width="100%"
              height="1px"
              style={{ backgroundColor: colors.separator }}
            />
          </tr>
        </table>
      </td>
    </tr>
  );
}
