import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export type AppIconName = 'program' | 'progress' | 'heart' | 'signOut' | 'sparkle';

export const AppIcon: React.FC<{
  name: AppIconName;
  size?: number;
  color?: string;
}> = ({ name, size = 22, color }) => {
  const theme = useTheme();
  const stroke = color ?? theme.colors.text;
  const common = {
    fill: 'none',
    stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2.2,
  };

  return (
    <Svg accessible={false} width={size} height={size} viewBox="0 0 24 24">
      {name === 'program' ? (
        <>
          <Path {...common} d="M5 4v16M5 5h11l-2 4 2 4H5" />
          <Circle {...common} cx="5" cy="4" r="1" />
        </>
      ) : name === 'progress' ? (
        <>
          <Path {...common} d="M4 19V10M10 19V5M16 19v-7M22 19V2" />
          <Path {...common} d="M3 19h19" />
        </>
      ) : name === 'heart' ? (
        <Path {...common} d="M20.8 5.8a5.3 5.3 0 0 0-7.5 0L12 7.1l-1.3-1.3a5.3 5.3 0 1 0-7.5 7.5L12 22l8.8-8.7a5.3 5.3 0 0 0 0-7.5Z" />
      ) : name === 'signOut' ? (
        <>
          <Path {...common} d="M10 17l5-5-5-5M15 12H3" />
          <Path {...common} d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
        </>
      ) : (
        <Path {...common} d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Zm7 14 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
      )}
    </Svg>
  );
};
