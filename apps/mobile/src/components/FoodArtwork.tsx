import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import type { FoodVisualKey } from '@fitnessapp/shared';
import { foodPalette as p } from '../theme';

type Artwork = React.FC<SvgProps>;

const Tomato: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Circle cx="48" cy="53" r="30" fill={p.red} stroke={p.outline} strokeWidth="4" />
    <Path d="M48 25c-8-10-17-8-20-7 8 3 10 8 11 12-7-2-12 1-15 5 10-1 16 4 24 4s14-5 24-4c-3-4-8-7-15-5 1-4 3-9 11-12-3-1-12-3-20 7Z" fill={p.leaf} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Path d="M31 48c3-7 9-11 16-12" fill="none" opacity=".45" stroke={p.cream} strokeLinecap="round" strokeWidth="5" />
  </Svg>
);

const Carrot: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Path d="M43 30c16 0 25 9 21 23L48 84 31 54c-8-14-3-24 12-24Z" fill={p.orange} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Path d="m42 31-7-19c8 1 13 6 14 16 2-10 8-15 17-16l-9 21" fill={p.leaf} stroke={p.outline} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    <Path d="m36 48 15 4M39 59l11 3" stroke={p.cream} strokeLinecap="round" strokeWidth="4" />
  </Svg>
);

const Avocado: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Path d="M49 12c13 0 29 34 29 49S65 84 48 84 18 76 18 61s18-49 31-49Z" fill={p.leafDark} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Path d="M49 22c9 0 20 28 20 38 0 11-9 16-21 16s-21-5-21-16c0-10 13-38 22-38Z" fill={p.yellow} />
    <Circle cx="48" cy="59" r="12" fill={p.brown} stroke={p.outline} strokeWidth="3" />
  </Svg>
);

const Fish: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Path d="M20 48c13-19 38-24 57-9l10-10v38L77 57c-19 15-44 10-57-9Z" fill={p.blue} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Circle cx="42" cy="42" r="3.5" fill={p.outline} />
    <Path d="M22 48h43M57 35c-5 7-5 19 0 26" fill="none" stroke={p.cream} strokeLinecap="round" strokeWidth="4" />
  </Svg>
);

const LeafyVegetable: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <G stroke={p.outline} strokeLinejoin="round" strokeWidth="4">
      <Path d="M48 82C21 75 13 52 24 21c16 3 27 12 31 26 4-14 13-23 27-27 8 31-6 55-34 62Z" fill={p.leaf} />
      <Path d="M48 82c0-23 9-43 27-57M49 80C46 56 40 39 27 26" fill="none" strokeLinecap="round" />
      <Path d="m45 60-18-9M54 55l17-11" fill="none" strokeLinecap="round" />
    </G>
  </Svg>
);

const Broccoli: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Path d="M44 45c2 13 0 25-8 37h25c-8-13-10-25-7-38" fill={p.leaf} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <G fill={p.leafDark} stroke={p.outline} strokeWidth="4">
      <Circle cx="31" cy="39" r="14" />
      <Circle cx="46" cy="29" r="17" />
      <Circle cx="64" cy="40" r="15" />
      <Circle cx="47" cy="46" r="15" />
    </G>
    <Path d="M43 54c4 5 7 12 7 25" fill="none" stroke={p.cream} strokeLinecap="round" strokeWidth="4" />
  </Svg>
);

const Eggplant: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Path d="M66 25c17 18 9 43-13 55-17 9-37-3-34-20 4-22 25-33 47-35Z" fill={p.purple} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Path d="M62 28c0-9 6-15 15-17-2 7 0 12 7 16-8 6-15 7-22 1Z" fill={p.leaf} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Path d="M30 57c5-10 14-17 26-20" fill="none" opacity=".5" stroke={p.cream} strokeLinecap="round" strokeWidth="5" />
  </Svg>
);

const BellPepper: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Path d="M49 26c18-7 31 5 29 23-2 23-10 35-29 35S21 72 19 49c-2-18 11-30 30-23Z" fill={p.red} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Path d="M49 29c-7-8-3-16 5-20 0 9 4 13 12 15-4 5-10 7-17 5Z" fill={p.leaf} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Path d="M48 33c-5 16-5 31 1 47M31 37c-4 12-3 24 3 34M66 37c4 12 3 24-3 34" fill="none" opacity=".35" stroke={p.cream} strokeLinecap="round" strokeWidth="4" />
  </Svg>
);

const Cucumber: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Ellipse cx="48" cy="48" rx="21" ry="36" fill={p.leafDark} stroke={p.outline} strokeWidth="4" transform="rotate(45 48 48)" />
    <Path d="M29 67c11-21 25-34 45-43" fill="none" opacity=".45" stroke={p.cream} strokeLinecap="round" strokeWidth="5" />
    <G fill={p.yellow}>
      <Circle cx="34" cy="56" r="2.5" /><Circle cx="44" cy="46" r="2.5" />
      <Circle cx="55" cy="37" r="2.5" /><Circle cx="61" cy="51" r="2.5" />
    </G>
  </Svg>
);

export const customFoodArtwork: Partial<Record<FoodVisualKey, Artwork>> = {
  'leafy-vegetable': LeafyVegetable,
  broccoli: Broccoli,
  carrot: Carrot,
  cucumber: Cucumber,
  eggplant: Eggplant,
  pepper: BellPepper,
  tomato: Tomato,
  avocado: Avocado,
  fish: Fish,
};
