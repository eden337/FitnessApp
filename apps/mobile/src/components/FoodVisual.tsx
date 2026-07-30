import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { FoodVisualKey } from '@fitnessapp/shared';
import { FoodArtwork } from './FoodArtwork';
import { foodImageAssetFor } from './foodImageAssets';
import { useTheme } from '../theme/ThemeProvider';

export interface FoodVisualProps {
  visualKey: FoodVisualKey;
}

type FoodFamily = 'vegetable' | 'fruit' | 'protein' | 'carbohydrate' | 'fat' | 'limited' | 'generic';

const familyKeys: Record<FoodFamily, ReadonlySet<FoodVisualKey>> = {
  vegetable: new Set([
    'artichoke', 'asparagus', 'onion', 'broccoli', 'okra', 'carrot',
    'butternut-squash', 'pumpkin', 'zucchini', 'lettuce', 'eggplant',
    'cilantro', 'white-or-red-cabbage', 'cauliflower', 'leek', 'turnip',
    'hearts-of-palm', 'cucumber', 'chard', 'sprouts', 'celery', 'tomato',
    'cherry-tomatoes', 'parsley', 'mushrooms', 'bell-pepper', 'radish',
    'kohlrabi', 'summer-squash', 'kale', 'green-or-yellow-beans', 'fennel',
    'spinach', 'baby-corn',
  ]),
  fruit: new Set([
    'watermelon', 'pear', 'cherimoya', 'fresh-pineapple', 'persimmon',
    'peach', 'grapefruit', 'banana', 'guava', 'cherries', 'quince',
    'fresh-lychee', 'melon', 'mango', 'apricot', 'nectarine', 'prickly-pear',
    'grapes', 'passion-fruit', 'papaya', 'kiwi', 'clementine', 'star-fruit',
    'pomegranate', 'plum', 'loquat', 'fresh-fig', 'orange', 'apple',
    'strawberry', 'berries', 'dried-fruit', 'fresh-fruit',
  ]),
  protein: new Set([
    'beans', 'lentils', 'chickpeas', 'edamame', 'eggs', 'fish', 'chicken',
    'meat', 'dairy-products', 'tofu', 'seitan',
  ]),
  carbohydrate: new Set([
    'flours-and-ground-foods', 'sweet-potato', 'potatoes', 'beetroot',
    'rice', 'peas', 'thick-rolled-oats', 'quinoa', 'buckwheat', 'corn',
    'pearl-barley', 'skinny-pasta',
  ]),
  fat: new Set([
    'tahini', 'butter', 'cooking-oil', 'olives', 'avocado',
    'peanut-butter', 'almond-butter', 'nuts-almonds', 'coconut-products',
  ]),
  limited: new Set(['sugars', 'diet-cola', 'dry-wine', 'beer', 'honey']),
  generic: new Set(['other-foods-on-vacation']),
};

export const foodFamilyFor = (key: FoodVisualKey): FoodFamily =>
  (Object.entries(familyKeys).find(([, keys]) => keys.has(key))?.[0] as FoodFamily | undefined) ??
  'generic';

export const FoodVisual: React.FC<FoodVisualProps> = ({ visualKey }) => {
  const theme = useTheme();
  const family = foodFamilyFor(visualKey);
  const imageSource = foodImageAssetFor(visualKey);
  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.foodTiles[family],
          borderColor: theme.colors.border,
        },
      ]}
      testID={`food-visual-${visualKey}`}
    >
      {imageSource ? (
        <Image
          accessible={false}
          resizeMode="contain"
          source={imageSource}
          style={styles.image}
          testID={`food-image-${visualKey}`}
        />
      ) : (
        <FoodArtwork
          accessible={false}
          family={family}
          height={52}
          visualKey={visualKey}
          width={52}
        />
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
    overflow: 'hidden',
  },
  image: {
    height: 58,
    width: 58,
  },
});
