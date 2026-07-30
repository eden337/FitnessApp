import React from 'react';
import { render } from '@testing-library/react-native';
import { FOOD_VISUAL_KEYS } from '@fitnessapp/shared';
import { FoodVisual } from '../src/components/FoodVisual';
import { foodFamilyFor } from '../src/components/FoodVisual';
import { hasPurposeBuiltFoodArtwork } from '../src/components/FoodArtwork';
import {
  foodImageAssetFor,
  SUPPLIED_FOOD_IMAGE_KEYS,
} from '../src/components/foodImageAssets';

describe('FoodVisual', () => {
  it('uses the supplied text-free image set for all 102 global foods', () => {
    expect(SUPPLIED_FOOD_IMAGE_KEYS).toHaveLength(102);
    expect(new Set(SUPPLIED_FOOD_IMAGE_KEYS).size).toBe(102);

    for (const key of SUPPLIED_FOOD_IMAGE_KEYS) {
      expect(foodImageAssetFor(key)).toBeDefined();
      const { getByTestId, unmount } = render(<FoodVisual visualKey={key} />);
      expect(getByTestId(`food-visual-${key}`)).toBeTruthy();
      expect(getByTestId(`food-image-${key}`)).toBeTruthy();
      unmount();
    }
  });

  it('keeps purpose-built fallbacks for the three vacation-only concepts', () => {
    const vacationKeys = FOOD_VISUAL_KEYS.filter((key) => foodImageAssetFor(key) === undefined);
    expect(vacationKeys).toEqual([
      'sugars',
      'flours-and-ground-foods',
      'other-foods-on-vacation',
    ]);
    for (const key of vacationKeys) {
      expect(hasPurposeBuiltFoodArtwork(key)).toBe(true);
      const { getByTestId, unmount } = render(<FoodVisual visualKey={key} />);
      expect(getByTestId(`food-visual-${key}`)).toBeTruthy();
      unmount();
    }
  });

  it('assigns stable semantic families rather than deriving tones from key length', () => {
    expect(foodFamilyFor('tomato')).toBe('vegetable');
    expect(foodFamilyFor('apple')).toBe('fruit');
    expect(foodFamilyFor('fish')).toBe('protein');
    expect(foodFamilyFor('avocado')).toBe('fat');
    expect(foodFamilyFor('dry-wine')).toBe('limited');
  });
});
