import React from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { CelebrationBanner } from '../src/components/CelebrationBanner';

const renderBanner = () =>
  render(<CelebrationBanner message="You did it" />);

describe('CelebrationBanner', () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('waits for the reduced-motion preference before starting animation', async () => {
    let resolvePreference!: (enabled: boolean) => void;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
      new Promise((resolve) => {
        resolvePreference = resolve;
      }),
    );
    const spring = jest.spyOn(Animated, 'spring').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    });

    renderBanner();
    expect(spring).not.toHaveBeenCalled();

    await act(async () => resolvePreference(false));
    await waitFor(() => expect(spring).toHaveBeenCalledTimes(1));
  });

  it('renders the final state without spring animation when reduced motion is enabled', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const spring = jest.spyOn(Animated, 'spring');

    renderBanner();

    await waitFor(() => expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled());
    expect(spring).not.toHaveBeenCalled();
  });

  it('stops an active spring when reduced motion is enabled at runtime', async () => {
    let onPreferenceChanged: ((enabled: boolean) => void) | undefined;
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_, listener) => {
      onPreferenceChanged = listener as unknown as (enabled: boolean) => void;
      return {
        remove: jest.fn(),
      } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>;
    });
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const stop = jest.fn();
    jest.spyOn(Animated, 'spring').mockReturnValue({
      start: jest.fn(),
      stop,
      reset: jest.fn(),
    });

    renderBanner();
    await waitFor(() => expect(Animated.spring).toHaveBeenCalledTimes(1));
    act(() => onPreferenceChanged?.(true));

    expect(stop).toHaveBeenCalled();
  });
});
