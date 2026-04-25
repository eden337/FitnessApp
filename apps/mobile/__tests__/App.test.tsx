import React from 'react';
import { render } from '@testing-library/react-native';
import { App } from '../src/app/App';
import { createInMemoryStorage } from '../src/services/secureStorage';

describe('App', () => {
  it('mounts the SignIn screen by default (Hebrew title)', () => {
    const { getByTestId, getAllByText } = render(<App storage={createInMemoryStorage()} />);
    expect(getByTestId('signin-screen')).toBeTruthy();
    expect(getAllByText('התחברות').length).toBeGreaterThan(0);
  });

  it('renders the English SignIn screen when locale is en', () => {
    const { getByTestId, getAllByText } = render(
      <App locale="en" storage={createInMemoryStorage()} />,
    );
    expect(getByTestId('signin-screen')).toBeTruthy();
    expect(getAllByText('Sign in').length).toBeGreaterThan(0);
  });
});
