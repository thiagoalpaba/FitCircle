import { Coffee, Sun, Apple, Moon, CloudMoon, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type MealCount = 3 | 4 | 5 | 6;

export type MealKey =
  | 'cafe'
  | 'lanchemanha'
  | 'almoco'
  | 'lanche'
  | 'jantar'
  | 'ceia';

export type MealConfig = {
  key: MealKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  color: string;
  emoji: string;
};

const CAFE: MealConfig = {
  key: 'cafe',
  label: 'Café da manhã',
  shortLabel: 'Café',
  icon: Coffee,
  color: '#F59E0B',
  emoji: 'C',
};

const LANCHE_MANHA: MealConfig = {
  key: 'lanchemanha',
  label: 'Lanche da manhã',
  shortLabel: 'Lanche',
  icon: Apple,
  color: '#3B82F6',
  emoji: 'LM',
};

const ALMOCO: MealConfig = {
  key: 'almoco',
  label: 'Almoço',
  shortLabel: 'Almoço',
  icon: Sun,
  color: '#22C55E',
  emoji: 'A',
};

const LANCHE: MealConfig = {
  key: 'lanche',
  label: 'Lanche da tarde',
  shortLabel: 'Lanche',
  icon: Apple,
  color: '#3B82F6',
  emoji: 'L',
};

const JANTAR: MealConfig = {
  key: 'jantar',
  label: 'Jantar',
  shortLabel: 'Jantar',
  icon: Moon,
  color: '#8B5CF6',
  emoji: 'J',
};

const CEIA: MealConfig = {
  key: 'ceia',
  label: 'Ceia',
  shortLabel: 'Ceia',
  icon: CloudMoon,
  color: '#6366F1',
  emoji: 'Ce',
};

export const MEAL_CONFIGS: Record<MealCount, MealConfig[]> = {
  3: [CAFE, ALMOCO, JANTAR],
  4: [CAFE, ALMOCO, LANCHE, JANTAR],
  5: [CAFE, LANCHE_MANHA, ALMOCO, LANCHE, JANTAR],
  6: [CAFE, LANCHE_MANHA, ALMOCO, LANCHE, JANTAR, CEIA],
};

export const DEFAULT_MEAL_CONFIGS = MEAL_CONFIGS[4];

export const getMealConfigs = (count: MealCount = 4) => {
  return MEAL_CONFIGS[count] || MEAL_CONFIGS[4];
};

export const getMealConfigByKey = (key: MealKey) => {
  return Object.values(MEAL_CONFIGS)
    .flat()
    .find(config => config.key === key) || {
    key,
    label: 'Refeição',
    shortLabel: 'Refeição',
    icon: Utensils,
    color: '#22C55E',
    emoji: 'R',
  };
};