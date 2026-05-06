import { Apple, CloudMoon, Coffee, Moon, Sun } from 'lucide-react';

export type MealCount = 3 | 4 | 5 | 6;

export interface MealConfig {
  key: string;
  label: string;
  icon: any;
  color: string;
}

export const MEAL_CONFIGS: Record<MealCount, MealConfig[]> = {
  3: [
    { key: 'cafe', label: 'Café da manhã', icon: Coffee, color: '#F59E0B' },
    { key: 'almoco', label: 'Almoço', icon: Sun, color: '#22C55E' },
    { key: 'jantar', label: 'Jantar', icon: Moon, color: '#8B5CF6' },
  ],
  4: [
    { key: 'cafe', label: 'Café da manhã', icon: Coffee, color: '#F59E0B' },
    { key: 'almoco', label: 'Almoço', icon: Sun, color: '#22C55E' },
    { key: 'lanche', label: 'Lanche da tarde', icon: Apple, color: '#3B82F6' },
    { key: 'jantar', label: 'Jantar', icon: Moon, color: '#8B5CF6' },
  ],
  5: [
    { key: 'cafe', label: 'Café da manhã', icon: Coffee, color: '#F59E0B' },
    { key: 'lancheManha', label: 'Lanche da manhã', icon: Apple, color: '#F97316' },
    { key: 'almoco', label: 'Almoço', icon: Sun, color: '#22C55E' },
    { key: 'lanche', label: 'Lanche da tarde', icon: Apple, color: '#3B82F6' },
    { key: 'jantar', label: 'Jantar', icon: Moon, color: '#8B5CF6' },
  ],
  6: [
    { key: 'cafe', label: 'Café da manhã', icon: Coffee, color: '#F59E0B' },
    { key: 'lancheManha', label: 'Lanche da manhã', icon: Apple, color: '#F97316' },
    { key: 'almoco', label: 'Almoço', icon: Sun, color: '#22C55E' },
    { key: 'lanche', label: 'Lanche da tarde', icon: Apple, color: '#3B82F6' },
    { key: 'jantar', label: 'Jantar', icon: Moon, color: '#8B5CF6' },
    { key: 'ceia', label: 'Ceia', icon: CloudMoon, color: '#6366F1' },
  ],
};