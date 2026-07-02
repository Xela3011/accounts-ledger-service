import { render, screen } from '@testing-library/react-native';

import App from '../App';

describe('<App />', () => {
  it('renders the login screen when no token is stored', async () => {
    render(<App />);

    expect(await screen.findByText('Qik Ledger')).toBeTruthy();
    expect(screen.getByText('Iniciar sesion')).toBeTruthy();
  });
});
