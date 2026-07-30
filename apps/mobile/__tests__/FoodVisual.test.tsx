import React from 'react';
import { render } from '@testing-library/react-native';
import { Image } from 'react-native';
import { FOOD_VISUAL_KEYS } from '@fitnessapp/shared';
import { FoodVisual } from '../src/components/FoodVisual';
import { foodFamilyFor } from '../src/components/FoodVisual';
import { foodVisualAssets } from '../src/components/foodVisualAssets';

describe('FoodVisual', () => {
  it('bundles artwork for every API-supported visual key', () => {
    expect(Object.keys(foodVisualAssets).sort()).toEqual([...FOOD_VISUAL_KEYS].sort());
    for (const key of FOOD_VISUAL_KEYS) {
      expect(foodVisualAssets[key]).toBeTruthy();
    }
  });

  it('renders the requested artwork as a decorative image', () => {
    const { getByTestId, UNSAFE_getByType } = render(<FoodVisual visualKey="apple" />);

    expect(getByTestId('food-visual-apple')).toBeTruthy();
    expect(UNSAFE_getByType(Image).props.accessible).toBe(false);
  });

  it('assigns stable semantic families rather than deriving tones from key length', () => {
    expect(foodFamilyFor('tomato')).toBe('vegetable');
    expect(foodFamilyFor('apple')).toBe('fruit');
    expect(foodFamilyFor('fish')).toBe('protein');
    expect(foodFamilyFor('avocado')).toBe('fat');
    expect(foodFamilyFor('wine')).toBe('limited');
  });
});
