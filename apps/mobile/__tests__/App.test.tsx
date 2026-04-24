import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { App } from '../src/app/App';

describe('App', () => {
  it('renders the Hebrew app name by default', () => {
    render(<App />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByText('כושר לזוגות')).toBeTruthy();
  });

  it('renders the English app name when locale is en', () => {
    render(<App locale="en" />);
    expect(screen.getByText('Couple Fit')).toBeTruthy();
  });
});
