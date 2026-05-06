import {
  Smile,
  Utensils,
  IceCream,
  CloudMoon,
  Dumbbell,
  Heart,
} from 'lucide-react';

export const CHECKIN_OPTIONS = [
  { key: 'bem', label: 'Estou bem', icon: Smile, color: '#22C55E' },
  { key: 'fome', label: 'Com fome', icon: Utensils, color: '#F59E0B' },
  { key: 'doce', label: 'Vontade de doce', icon: IceCream, color: '#EC4899' },
  { key: 'dificil', label: 'Dia difícil', icon: CloudMoon, color: '#6366F1' },
  { key: 'treino', label: 'Treinei hoje', icon: Dumbbell, color: '#3B82F6' },
  { key: 'apoio', label: 'Preciso de apoio', icon: Heart, color: '#EF4444' },
];

export const QUICK_MSGS = [
  'Bora fechar o dia bem 💪',
  'Boa refeição! 🥗',
  'Toma água! 💧',
  'Amanhã ajusta',
  'Você está indo bem ✨',
];

export const SUBSTITUTIONS = [
  {
    group: 'Carboidratos',
    items: [
      'Arroz branco → Arroz integral',
      'Pão francês → Pão integral',
      'Batata inglesa → Batata-doce',
      'Cuscuz → Aveia',
    ],
  },
  {
    group: 'Proteínas',
    items: [
      'Carne bovina → Frango grelhado',
      'Ovo inteiro → Claras de ovo',
    ],
  },
  {
    group: 'Gorduras',
    items: [
      'Manteiga → Requeijão light',
      'Queijo amarelo → Queijo minas/cottage',
    ],
  },
];