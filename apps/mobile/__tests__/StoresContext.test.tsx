import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useStores } from '../src/stores/StoresContext';

const Probe: React.FC = () => {
  useStores();
  return <Text>ok</Text>;
};

describe('useStores', () => {
  const realError = console.error;
  beforeAll(() => {
    // The error boundary noise from React would otherwise spam test output.
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = realError;
  });

  it('throws when called outside a StoresProvider', () => {
    expect(() => render(<Probe />)).toThrow(/useStores called outside/);
  });
});
