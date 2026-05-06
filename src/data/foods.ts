export interface FoodItem {
  name: string;
  category: string;
  cal: number;
  p: number;
  c: number;
  f: number;
  source?: string;
  un?: string;
  amountPerUn?: number;
  isGluten?: boolean;
  isLactose?: boolean;
  isEgg?: boolean;
  isSupplement?: boolean;
  tags?: string[];
}

export const CATEGORIES = [
  'Todas',
  'Proteína Leve',
  'Proteína Principal',
  'Café da manhã',
  'Carboidratos principais',
  'Carboidratos do café',
  'Frutas',
  'Vegetais',
  'Gorduras',
  'Laticínios',
  'Leguminosa',
  'Bebidas',
  'Suplementos',
];

export const FOOD_DATABASE: FoodItem[] = [
  // Proteínas leves / ovos / laticínios
  { name: 'Ovo de galinha', category: 'Proteína Leve', cal: 155, p: 13, c: 1.1, f: 11, un: 'unidade', amountPerUn: 50, isEgg: true, tags: ['cafe', 'lanche', 'principal'] },
  { name: 'Clara de ovo', category: 'Proteína Leve', cal: 52, p: 11, c: 0.7, f: 0.2, un: 'unidade', amountPerUn: 35, isEgg: true, tags: ['cafe', 'lanche'] },
  { name: 'Queijo minas frescal', category: 'Laticínios', cal: 240, p: 17, c: 3, f: 18, un: 'fatia', amountPerUn: 30, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Queijo cottage', category: 'Laticínios', cal: 98, p: 11, c: 3.4, f: 4.3, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Iogurte natural', category: 'Laticínios', cal: 61, p: 3.5, c: 4.7, f: 3.3, un: 'pote', amountPerUn: 170, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Leite integral', category: 'Laticínios', cal: 61, p: 3.2, c: 4.8, f: 3.3, isLactose: true, tags: ['cafe'] },
  { name: 'Leite desnatado', category: 'Laticínios', cal: 35, p: 3.4, c: 5, f: 0.1, isLactose: true, tags: ['cafe'] },
  { name: 'Requeijão light', category: 'Laticínios', cal: 180, p: 10, c: 3, f: 14, un: 'colher de sopa', amountPerUn: 20, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Manteiga', category: 'Gorduras', cal: 717, p: 0.8, c: 0, f: 81, un: 'gramas', amountPerUn: 1, isLactose: true, tags: ['cafe'] },
  { name: 'Whey Protein', category: 'Proteína Leve', cal: 390, p: 80, c: 5, f: 5, tags: ['cafe', 'lanche'], isSupplement: true },
  { name: 'Achocolatado', category: 'Suplementos', cal: 380, p: 5, c: 85, f: 2, tags: ['cafe'] },
  { name: 'Café sem açúcar', category: 'Bebidas', cal: 2, p: 0.1, c: 0.3, f: 0, un: 'xícara', amountPerUn: 200, tags: ['cafe'] },

  // Proteínas principais
  { name: 'Peito de Frango grelhado', category: 'Proteína Principal', cal: 165, p: 31, c: 0, f: 3.6, tags: ['principal', 'lanche'] },
  { name: 'Frango grelhado', category: 'Proteína Principal', cal: 165, p: 31, c: 0, f: 3.6, tags: ['principal', 'lanche'] },
  { name: 'Patinho moído', category: 'Proteína Principal', cal: 219, p: 35.9, c: 0, f: 7.3, tags: ['principal'] },
  { name: 'Tilápia grelhada', category: 'Proteína Principal', cal: 128, p: 26, c: 0, f: 2.7, tags: ['principal'] },
  { name: 'Sobrecoxa sem pele', category: 'Proteína Principal', cal: 160, p: 25, c: 0, f: 6, tags: ['principal'] },
  { name: 'Carne magra grelhada', category: 'Proteína Principal', cal: 195, p: 28, c: 0, f: 9, tags: ['principal'] },
  { name: 'Atum em lata (água)', category: 'Proteína Principal', cal: 116, p: 26, c: 0, f: 1, un: 'lata', amountPerUn: 120, tags: ['lanche', 'principal'] },

  // Café da manhã / carboidratos matinais
  { name: 'Pão integral', category: 'Café da manhã', cal: 247, p: 9.4, c: 49.9, f: 3.7, un: 'fatia', amountPerUn: 25, isGluten: true, tags: ['cafe', 'lanche'] },
  { name: 'Pão francês', category: 'Café da manhã', cal: 300, p: 8, c: 58, f: 3, un: 'unidade', amountPerUn: 50, isGluten: true, tags: ['cafe'] },
  { name: 'Tapioca (goma)', category: 'Café da manhã', cal: 240, p: 0, c: 60, f: 0, tags: ['cafe', 'lanche'] },
  { name: 'Aveia em flocos', category: 'Café da manhã', cal: 394, p: 13.9, c: 66.6, f: 8.5, tags: ['cafe', 'lanche'] },
  { name: 'Cuscuz de milho', category: 'Café da manhã', cal: 112, p: 2.2, c: 25, f: 0.3, tags: ['cafe'] },
  { name: 'Granola', category: 'Café da manhã', cal: 400, p: 10, c: 60, f: 15, tags: ['cafe', 'lanche'] },

  // Carboidratos principais
  { name: 'Arroz branco cozido', category: 'Carboidratos principais', cal: 128, p: 2.5, c: 28.1, f: 0.2, tags: ['principal'] },
  { name: 'Arroz integral cozido', category: 'Carboidratos principais', cal: 124, p: 2.6, c: 25.8, f: 1.0, tags: ['principal'] },
  { name: 'Macarrão integral', category: 'Carboidratos principais', cal: 124, p: 5.3, c: 26.5, f: 0.5, tags: ['principal'], isGluten: true },
  { name: 'Batata inglesa cozida', category: 'Carboidratos principais', cal: 52, p: 1.2, c: 11.9, f: 0, tags: ['principal'] },
  { name: 'Batata-doce cozida', category: 'Carboidratos principais', cal: 77, p: 0.6, c: 18.4, f: 0.1, tags: ['principal', 'lanche'] },
  { name: 'Mandioca cozida', category: 'Carboidratos principais', cal: 125, p: 0.6, c: 30.1, f: 0.3, tags: ['principal'] },
  { name: 'Inhame cozido', category: 'Carboidratos principais', cal: 97, p: 1.5, c: 23.2, f: 0.2, tags: ['principal'] },
  { name: 'Cuscuz de milho cozido', category: 'Carboidratos principais', cal: 112, p: 2.2, c: 25, f: 0.3, tags: ['principal', 'cafe'] },

  // Leguminosas
  { name: 'Feijão preto cozido', category: 'Leguminosa', cal: 77, p: 4.5, c: 14, f: 0.5, tags: ['principal'] },
  { name: 'Feijão carioca cozido', category: 'Leguminosa', cal: 76, p: 4.8, c: 13.6, f: 0.5, tags: ['principal'] },
  { name: 'Lentilha cozida', category: 'Leguminosa', cal: 116, p: 9, c: 20, f: 0.4, tags: ['principal'] },
  { name: 'Grão-de-bico cozido', category: 'Leguminosa', cal: 164, p: 9, c: 27, f: 2.6, tags: ['principal'] },

  // Frutas
  { name: 'Banana prata', category: 'Frutas', cal: 98, p: 1.3, c: 26, f: 0.1, un: 'unidade', amountPerUn: 80, tags: ['cafe', 'lanche'] },
  { name: 'Maçã', category: 'Frutas', cal: 52, p: 0.3, c: 14.1, f: 0.2, un: 'unidade', amountPerUn: 130, tags: ['cafe', 'lanche'] },
  { name: 'Morango', category: 'Frutas', cal: 30, p: 0.9, c: 6.8, f: 0.3, tags: ['cafe', 'lanche'] },
  { name: 'Mamão papaia', category: 'Frutas', cal: 40, p: 0.5, c: 10.4, f: 0.1, un: 'porção', amountPerUn: 150, tags: ['cafe', 'lanche'] },

  // Vegetais e gorduras
  { name: 'Salada verde', category: 'Vegetais', cal: 15, p: 1, c: 2, f: 0, tags: ['principal'] },
  { name: 'Legumes variados', category: 'Vegetais', cal: 35, p: 2, c: 7, f: 0, tags: ['principal'] },
  { name: 'Brócolis cozido', category: 'Vegetais', cal: 35, p: 2.8, c: 7, f: 0.4, tags: ['principal'] },
  { name: 'Azeite de oliva', category: 'Gorduras', cal: 884, p: 0, c: 0, f: 100, un: 'colher de sopa', amountPerUn: 10, tags: ['principal'] },
  { name: 'Pasta de amendoim', category: 'Gorduras', cal: 588, p: 25, c: 20, f: 50, un: 'colher de sopa', amountPerUn: 15, tags: ['cafe', 'lanche'] },
  { name: 'Abacate', category: 'Gorduras', cal: 160, p: 2, c: 9, f: 15, tags: ['cafe', 'lanche'] },

  // Lanches / extras
  { name: 'Pipoca (milho p/ estourar)', category: 'Carboidratos do café', cal: 360, p: 10, c: 70, f: 4, un: 'gramas', amountPerUn: 1, tags: ['lanche'] },
  { name: 'Mel', category: 'Carboidratos do café', cal: 304, p: 0.3, c: 82, f: 0, un: 'colher de sopa', amountPerUn: 15, tags: ['cafe', 'lanche'] },

  // Vegetarianos / veganos
  { name: 'Tofu grelhado', category: 'Proteína Principal', cal: 120, p: 12, c: 3, f: 7, tags: ['principal', 'lanche'] },
  { name: 'Proteína de soja', category: 'Proteína Principal', cal: 320, p: 50, c: 30, f: 1, tags: ['principal'] },
  { name: 'Bebida de aveia', category: 'Bebidas', cal: 45, p: 1, c: 8, f: 1.5, tags: ['cafe'] },
  { name: 'Bebida de amêndoas', category: 'Bebidas', cal: 25, p: 0.5, c: 1, f: 2, tags: ['cafe'] },
];

export const FOODS = FOOD_DATABASE;