type ListType = 'ordered' | 'unordered';
type ListProps = {
  type?: ListType;
  items: string[];
  style?: Partial<React.CSSProperties>;
};

export function List({
  type = 'unordered',
  items = [],
  style = {},
}: ListProps) {
  const listItems = items.map((itm, idx) => <li key={`eli-${idx}`}>{itm}</li>);

  const listElement = () => {
    switch (type) {
      case 'ordered':
        return <ol style={style}>{listItems}</ol>;
      case 'unordered':
        return <ul style={style}>{listItems}</ul>;
    }
  };

  return (
    <tr>
      <td>{listElement()}</td>
    </tr>
  );
}
