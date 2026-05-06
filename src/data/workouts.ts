import {
  Activity,
  Bike,
  Dumbbell,
  Footprints,
  Gauge,
  Waves,
  CircleEllipsis,
  Flower2,
  StretchHorizontal,
} from 'lucide-react';

export type WorkoutType =
  | 'caminhada'
  | 'corrida'
  | 'musculacao'
  | 'bike'
  | 'hidroginastica'
  | 'pilates'
  | 'yoga'
  | 'outro';

export type Intensity = 'leve' | 'moderada' | 'intensa';

export const WORKOUT_TYPES: { key: WorkoutType; label: string; icon: any }[] = [
  { key: 'caminhada', label: 'Caminhada', icon: Footprints },
  { key: 'corrida', label: 'Corrida', icon: Gauge },
  { key: 'musculacao', label: 'Musculação', icon: Dumbbell },
  { key: 'bike', label: 'Bike', icon: Bike },
  { key: 'hidroginastica', label: 'Hidroginástica', icon: Waves },
  { key: 'pilates', label: 'Pilates', icon: StretchHorizontal },
  { key: 'yoga', label: 'Yoga', icon: Flower2 },
  { key: 'outro', label: 'Outro treino', icon: CircleEllipsis },
];

export const INTENSITIES: { key: Intensity; label: string; color: string }[] = [
  { key: 'leve', label: 'Leve', color: '#22C55E' },
  { key: 'moderada', label: 'Moderada', color: '#F59E0B' },
  { key: 'intensa', label: 'Intensa', color: '#EF4444' },
];

export const BASE_CALS: Record<WorkoutType, number> = {
  caminhada: 4,
  corrida: 9,
  musculacao: 6,
  bike: 7,
  hidroginastica: 4,
  pilates: 3.5,
  yoga: 3,
  outro: 5,
};

export const INT_MULT: Record<Intensity, number> = {
  leve: 0.8,
  moderada: 1.0,
  intensa: 1.3,
};