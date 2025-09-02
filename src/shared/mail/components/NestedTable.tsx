export function NestedTable({ children, style = {}, ...restProps }) {
  return (
    <table
      border={0}
      cellPadding={0}
      cellSpacing={0}
      style={{
        borderCollapse: 'separate',
        ['msoTableLspace' as any]: '0pt',
        ['msoTableRspace' as any]: '0pt',
        width: 'auto',
        ...style,
      }}
      {...restProps}
    >
      {children}
    </table>
  );
}
