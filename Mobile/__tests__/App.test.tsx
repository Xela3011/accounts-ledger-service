import { render, screen } from '@testing-library/react-native';

import App from '../App';

describe('<App />', () => {
  it('renders the setup home screen', async () => {
    render(<App />);

    expect(await screen.findByText('Mobile setup is ready')).toBeTruthy();
    expect(screen.getByText(/GraphQL endpoint:/)).toBeTruthy();
  });
});
