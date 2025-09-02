import ReactDOM from 'react-dom';

import { Language } from 'src/shared/enums';

import { RecoverPasswordTemplate } from 'src/identity/application/recover-password/recover-password.template';

const DATA = {
  firstName: 'John',
  recoveryLink: 'http://localhost:3000',
};
const lang = Language.Spanish;
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
      <RecoverPasswordTemplate lang={lang} data={DATA} />
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
