import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SharedActivityKind } from '@fitnessapp/shared';
import { useTranslation } from '../i18n/I18nProvider';
import type { AppTheme } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export type ActivityChoice = {
  kind: SharedActivityKind;
  emoji: string;
  color: keyof AppTheme['colors']['foodTiles'];
};

export const activityChoices: readonly ActivityChoice[] = [
  { kind: 'hydration', emoji: '💧', color: 'protein' },
  { kind: 'vegetables', emoji: '🥦', color: 'vegetable' },
  { kind: 'movement', emoji: '👟', color: 'carbohydrate' },
  { kind: 'meal_together', emoji: '🍽️', color: 'fruit' },
  { kind: 'encouragement', emoji: '💛', color: 'generic' },
];

export const activityChoice = (kind: SharedActivityKind): ActivityChoice =>
  activityChoices.find((candidate) => candidate.kind === kind)!;

export const ActivityKindPicker: React.FC<{
  selected: SharedActivityKind | null;
  onSelect: (kind: SharedActivityKind) => void;
}> = ({ selected, onSelect }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.choices}>
      {activityChoices.map((choice) => {
        const isSelected = selected === choice.kind;
        return (
          <Pressable
            key={choice.kind}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(choice.kind)}
            style={[
              styles.choice,
              { backgroundColor: theme.colors.foodTiles[choice.color] },
              isSelected ? styles.choiceSelected : null,
            ]}
            testID={`activity-kind-${choice.kind}`}
          >
            <Text style={styles.emoji}>{choice.emoji}</Text>
            <Text style={styles.label}>{t(`activity:kinds.${choice.kind}`)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  choice: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: theme.radii.lg,
    borderWidth: 3,
    flexBasis: '46%',
    flexGrow: 1,
    gap: theme.spacing.xs,
    minHeight: 104,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  choiceSelected: { borderColor: theme.colors.progress },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  emoji: { fontSize: 36 },
  label: {
    ...theme.typography.label,
    color: theme.foodPalette.outline,
    textAlign: 'center',
  },
});
