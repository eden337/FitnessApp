import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import type { FoodVisualKey } from '@fitnessapp/shared';
import { foodPalette as p } from '../theme';

type Artwork = React.FC<SvgProps>;
export type FoodArtworkFamily =
  | 'vegetable'
  | 'fruit'
  | 'protein'
  | 'carbohydrate'
  | 'fat'
  | 'limited'
  | 'generic';

const Sugars: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Ellipse cx="48" cy="71" rx="34" ry="13" fill={p.cream} stroke={p.outline} strokeWidth="4" />
    <Path d="M19 51h58l-7 25H26Z" fill={p.blue} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Rect x="29" y="35" width="20" height="20" rx="3" fill={p.cream} stroke={p.outline} strokeWidth="3" />
    <Rect x="49" y="30" width="20" height="20" rx="3" fill={p.cream} stroke={p.outline} strokeWidth="3" />
  </Svg>
);

const Flours: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Path d="M28 17h40l-4 13 8 51H24l8-51Z" fill={p.cream} stroke={p.outline} strokeLinejoin="round" strokeWidth="4" />
    <Path d="M32 30h32M35 62h26" stroke={p.brown} strokeLinecap="round" strokeWidth="4" />
    <Path d="M48 42v15m0-9-8-5m8 5 8-5" stroke={p.yellow} strokeLinecap="round" strokeWidth="4" />
  </Svg>
);

const VacationFoods: Artwork = (props) => (
  <Svg viewBox="0 0 96 96" {...props}>
    <Circle cx="48" cy="50" r="29" fill={p.cream} stroke={p.outline} strokeWidth="4" />
    <Circle cx="48" cy="50" r="18" fill={p.orange} opacity=".85" />
    <Path d="M13 24v51M8 24v18h10V24M83 24v51M78 24c0 12 10 12 10 0" fill="none" stroke={p.outline} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    <Path d="m39 49 6 6 13-15" fill="none" stroke={p.cream} strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
  </Svg>
);

const vacationArtwork: Partial<Record<FoodVisualKey, Artwork>> = {
  sugars: Sugars,
  'flours-and-ground-foods': Flours,
  'other-foods-on-vacation': VacationFoods,
};

export const hasPurposeBuiltFoodArtwork = (visualKey: FoodVisualKey): boolean =>
  vacationArtwork[visualKey] !== undefined;

export const FoodArtwork: React.FC<
  SvgProps & { visualKey: FoodVisualKey; family: FoodArtworkFamily }
> = ({ visualKey, family: _family, ...props }) => {
  const Artwork = vacationArtwork[visualKey];
  return Artwork ? <Artwork {...props} /> : null;
};
