import ReactDOM from 'react-dom';

import { RecoverPasswordTemplate } from 'src/identity/application/recover-password/recover-password.template';

const DATA = {
  firstName: 'John',
  recoveryLink: 'http://localhost:3000',
};

function App() {
  return (
    <>
      <header
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ lineHeight: 1 }}>Mails</h1>
          <div
            style={{ fontStyle: 'italic', fontSize: 14, fontWeight: 'normal' }}
          >
            Development
          </div>
        </div>
      </header>
      <RecoverPasswordTemplate data={DATA} />
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
