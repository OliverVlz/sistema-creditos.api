export function Paragraph({
  children,
  paddingBottom,
  paddingTop,
  textDecoration,
  fontWeight,
  fontSize,
  textAlign,
  style = {},
  ...restProps
}: Partial<
  React.TableHTMLAttributes<any> &
    React.CSSProperties & { children: React.ReactNode }
>) {
  return (
    <tr>
      <td
        {...restProps}
        style={{
          paddingBottom,
          paddingTop,
          fontWeight,
          textDecoration,
          fontSize,
          textAlign,
          ...style,
        }}
      >
        {children}
      </td>
    </tr>
  );
}
