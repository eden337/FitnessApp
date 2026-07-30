import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { FoodVisualKey } from '@fitnessapp/shared';
import { foodVisualAssets } from './foodVisualAssets';
import { customFoodArtwork } from './FoodArtwork';
import { useTheme } from '../theme/ThemeProvider';

export interface FoodVisualProps {
  visualKey: FoodVisualKey;
}

type FoodFamily = 'vegetable' | 'fruit' | 'protein' | 'carbohydrate' | 'fat' | 'limited' | 'generic';

const familyKeys: Record<FoodFamily, ReadonlySet<FoodVisualKey>> = {
  vegetable: new Set(['leafy-vegetable', 'onion', 'broccoli', 'carrot', 'squash', 'pumpkin', 'zucchini', 'eggplant', 'cabbage', 'cauliflower', 'root-vegetable', 'cucumber', 'sprouts', 'celery', 'tomato', 'mushroom', 'pepper', 'radish', 'fennel']),
  fruit: new Set(['watermelon', 'pear', 'pineapple', 'orange-fruit', 'peach', 'citrus', 'banana', 'cherries', 'melon', 'mango', 'grapes', 'tropical-fruit', 'papaya', 'kiwi', 'pomegranate', 'plum', 'fig', 'apple', 'strawberry', 'berries', 'dried-fruit']),
  protein: new Set(['beans', 'eggs', 'fish', 'chicken', 'meat', 'dairy', 'tofu']),
  carbohydrate: new Set(['bread', 'corn', 'sweet-potato', 'potato', 'beet', 'rice', 'peas', 'oats', 'grain', 'pasta']),
  fat: new Set(['butter', 'oil', 'olives', 'avocado', 'peanut', 'nuts', 'coconut']),
  limited: new Set(['candy', 'soda', 'wine', 'beer', 'honey']),
  generic: new Set(['meal', 'bowl']),
};

export const foodFamilyFor = (key: FoodVisualKey): FoodFamily =>
  (Object.entries(familyKeys).find(([, keys]) => keys.has(key))?.[0] as FoodFamily | undefined) ??
  'generic';

export const FoodVisual: React.FC<FoodVisualProps> = ({ visualKey }) => {
  const theme = useTheme();
  const Artwork = customFoodArtwork[visualKey];
  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.foodTiles[foodFamilyFor(visualKey)],
          borderColor: theme.colors.border,
        },
      ]}
      testID={`food-visual-${visualKey}`}
    >
      {Artwork ? (
        <Artwork accessible={false} width={52} height={52} />
      ) : (
        <Image accessible={false} resizeMode="contain" source={foodVisualAssets[visualKey]} style={styles.image} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 48,
    height: 48,
  },
});
