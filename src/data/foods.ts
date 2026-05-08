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

  // Campos opcionais para receitas do app
  recipe?: string[];
  prep?: string;
  portionNote?: string;
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
  'Sucos naturais',
  'Vitaminas',
  'Receitas fitness',
  'Doces fitness',
  'Suplementos',
];

export const FOOD_DATABASE: FoodItem[] = [
  // Proteínas leves / ovos / laticínios
  { name: 'Ovo de galinha', category: 'Proteína Leve', cal: 155, p: 13, c: 1.1, f: 11, un: 'unidade', amountPerUn: 50, isEgg: true, tags: ['cafe', 'lanche', 'principal'] },
  { name: 'Clara de ovo', category: 'Proteína Leve', cal: 52, p: 11, c: 0.7, f: 0.2, un: 'unidade', amountPerUn: 35, isEgg: true, tags: ['cafe', 'lanche'] },
  { name: 'Queijo minas frescal', category: 'Laticínios', cal: 240, p: 17, c: 3, f: 18, un: 'fatia', amountPerUn: 30, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Queijo minas light', category: 'Laticínios', cal: 160, p: 18, c: 3, f: 8, un: 'fatia', amountPerUn: 30, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Queijo cottage', category: 'Laticínios', cal: 98, p: 11, c: 3.4, f: 4.3, un: 'colher de sopa', amountPerUn: 30, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Ricota', category: 'Laticínios', cal: 140, p: 12, c: 4, f: 8, un: 'fatia', amountPerUn: 30, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Cream cheese light', category: 'Laticínios', cal: 160, p: 7, c: 5, f: 12, un: 'colher de sopa', amountPerUn: 20, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Iogurte natural', category: 'Laticínios', cal: 61, p: 3.5, c: 4.7, f: 3.3, un: 'pote', amountPerUn: 170, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Iogurte desnatado', category: 'Laticínios', cal: 45, p: 4, c: 5.5, f: 0.2, un: 'pote', amountPerUn: 170, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Iogurte grego light', category: 'Laticínios', cal: 75, p: 8, c: 6, f: 2, un: 'pote', amountPerUn: 100, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Leite integral', category: 'Laticínios', cal: 61, p: 3.2, c: 4.8, f: 3.3, un: 'copo', amountPerUn: 200, isLactose: true, tags: ['cafe'] },
  { name: 'Leite desnatado', category: 'Laticínios', cal: 35, p: 3.4, c: 5, f: 0.1, un: 'copo', amountPerUn: 200, isLactose: true, tags: ['cafe'] },
  { name: 'Requeijão light', category: 'Laticínios', cal: 180, p: 10, c: 3, f: 14, un: 'colher de sopa', amountPerUn: 20, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Manteiga', category: 'Gorduras', cal: 717, p: 0.8, c: 0, f: 81, un: 'gramas', amountPerUn: 1, isLactose: true, tags: ['cafe'] },
  {
  name: 'Whey Protein',
  category: 'Proteína Leve',
  cal: 390,
  p: 80,
  c: 8,
  f: 5,
  un: 'dose',
  amountPerUn: 30,
  portionNote: '1 dose de 30g',
  tags: ['proteína', 'suplemento', 'whey'],
},
  { name: 'Achocolatado', category: 'Suplementos', cal: 380, p: 5, c: 85, f: 2, tags: ['cafe'] },
  { name: 'Café sem açúcar', category: 'Bebidas', cal: 2, p: 0.1, c: 0.3, f: 0, un: 'xícara', amountPerUn: 200, tags: ['cafe'] },

  // Proteínas principais
  { name: 'Peito de Frango grelhado', category: 'Proteína Principal', cal: 165, p: 31, c: 0, f: 3.6, tags: ['principal', 'lanche'] },
  { name: 'Frango grelhado', category: 'Proteína Principal', cal: 165, p: 31, c: 0, f: 3.6, tags: ['principal', 'lanche'] },
  { name: 'Frango desfiado', category: 'Proteína Principal', cal: 165, p: 31, c: 0, f: 3.6, tags: ['lanche', 'principal'] },
  { name: 'Patinho moído', category: 'Proteína Principal', cal: 219, p: 35.9, c: 0, f: 7.3, tags: ['principal'] },
  { name: 'Carne magra grelhada', category: 'Proteína Principal', cal: 195, p: 28, c: 0, f: 9, tags: ['principal'] },
  { name: 'Coxão mole grelhado', category: 'Proteína Principal', cal: 210, p: 30, c: 0, f: 9, tags: ['principal'] },
  { name: 'Alcatra grelhada', category: 'Proteína Principal', cal: 220, p: 30, c: 0, f: 10, tags: ['principal'] },
  { name: 'Tilápia grelhada', category: 'Proteína Principal', cal: 128, p: 26, c: 0, f: 2.7, tags: ['principal'] },
  { name: 'Salmão grelhado', category: 'Proteína Principal', cal: 208, p: 22, c: 0, f: 13, tags: ['principal'] },
  { name: 'Sardinha em lata', category: 'Proteína Principal', cal: 208, p: 25, c: 0, f: 11, un: 'lata', amountPerUn: 125, tags: ['principal', 'lanche'] },
  { name: 'Atum em lata (água)', category: 'Proteína Principal', cal: 116, p: 26, c: 0, f: 1, un: 'lata', amountPerUn: 120, tags: ['lanche', 'principal'] },
  { name: 'Sobrecoxa sem pele', category: 'Proteína Principal', cal: 160, p: 25, c: 0, f: 6, tags: ['principal'] },
  { name: 'Peito de peru', category: 'Proteína Principal', cal: 105, p: 18, c: 2, f: 2, un: 'fatia', amountPerUn: 20, tags: ['cafe', 'lanche'] },

  // Café da manhã / carboidratos matinais
  { name: 'Pão integral', category: 'Café da manhã', cal: 247, p: 9.4, c: 49.9, f: 3.7, un: 'fatia', amountPerUn: 25, isGluten: true, tags: ['cafe', 'lanche'] },
  { name: 'Pão francês', category: 'Café da manhã', cal: 300, p: 8, c: 58, f: 3, un: 'unidade', amountPerUn: 50, isGluten: true, tags: ['cafe'] },
  { name: 'Pão árabe', category: 'Café da manhã', cal: 275, p: 9, c: 55, f: 1.5, un: 'unidade', amountPerUn: 50, isGluten: true, tags: ['cafe', 'lanche'] },
  { name: 'Pão sírio', category: 'Café da manhã', cal: 275, p: 9, c: 55, f: 1.5, un: 'unidade', amountPerUn: 50, isGluten: true, tags: ['cafe', 'lanche'] },
  { name: 'Wrap integral', category: 'Café da manhã', cal: 280, p: 9, c: 48, f: 6, un: 'unidade', amountPerUn: 60, isGluten: true, tags: ['lanche', 'cafe'] },
  { name: 'Torrada integral', category: 'Café da manhã', cal: 360, p: 12, c: 70, f: 4, un: 'unidade', amountPerUn: 10, isGluten: true, tags: ['cafe', 'lanche'] },
  { name: 'Tapioca (goma)', category: 'Café da manhã', cal: 240, p: 0, c: 60, f: 0, tags: ['cafe', 'lanche'] },
  { name: 'Crepioca', category: 'Café da manhã', cal: 180, p: 8, c: 22, f: 6, un: 'unidade', amountPerUn: 100, isEgg: true, tags: ['cafe', 'lanche'] },
  { name: 'Aveia em flocos', category: 'Café da manhã', cal: 394, p: 13.9, c: 66.6, f: 8.5, tags: ['cafe', 'lanche'] },
  { name: 'Aveia fina', category: 'Café da manhã', cal: 394, p: 13.9, c: 66.6, f: 8.5, tags: ['cafe', 'lanche'] },
  { name: 'Cuscuz de milho', category: 'Café da manhã', cal: 112, p: 2.2, c: 25, f: 0.3, tags: ['cafe'] },
  { name: 'Granola', category: 'Café da manhã', cal: 400, p: 10, c: 60, f: 15, tags: ['cafe', 'lanche'] },
  { name: 'Granola sem açúcar', category: 'Café da manhã', cal: 370, p: 10, c: 58, f: 10, tags: ['cafe', 'lanche'] },

  // Carboidratos principais
  { name: 'Arroz branco cozido', category: 'Carboidratos principais', cal: 128, p: 2.5, c: 28.1, f: 0.2, tags: ['principal'] },
  { name: 'Arroz integral cozido', category: 'Carboidratos principais', cal: 124, p: 2.6, c: 25.8, f: 1.0, tags: ['principal'] },
  { name: 'Macarrão integral', category: 'Carboidratos principais', cal: 124, p: 5.3, c: 26.5, f: 0.5, tags: ['principal'], isGluten: true },
  { name: 'Macarrão comum cozido', category: 'Carboidratos principais', cal: 131, p: 5, c: 25, f: 1.1, tags: ['principal'], isGluten: true },
  { name: 'Batata inglesa cozida', category: 'Carboidratos principais', cal: 52, p: 1.2, c: 11.9, f: 0, tags: ['principal'] },
  { name: 'Batata-doce cozida', category: 'Carboidratos principais', cal: 77, p: 0.6, c: 18.4, f: 0.1, tags: ['principal', 'lanche'] },
  { name: 'Mandioca cozida', category: 'Carboidratos principais', cal: 125, p: 0.6, c: 30.1, f: 0.3, tags: ['principal'] },
  { name: 'Inhame cozido', category: 'Carboidratos principais', cal: 97, p: 1.5, c: 23.2, f: 0.2, tags: ['principal'] },
  { name: 'Cuscuz de milho cozido', category: 'Carboidratos principais', cal: 112, p: 2.2, c: 25, f: 0.3, tags: ['principal', 'cafe'] },
  { name: 'Quinoa cozida', category: 'Carboidratos principais', cal: 120, p: 4.4, c: 21.3, f: 1.9, tags: ['principal'] },
  { name: 'Purê de batata', category: 'Carboidratos principais', cal: 90, p: 2, c: 15, f: 3, tags: ['principal'] },

  // Leguminosas
  { name: 'Feijão preto cozido', category: 'Leguminosa', cal: 77, p: 4.5, c: 14, f: 0.5, tags: ['principal'] },
  { name: 'Feijão carioca cozido', category: 'Leguminosa', cal: 76, p: 4.8, c: 13.6, f: 0.5, tags: ['principal'] },
  { name: 'Lentilha cozida', category: 'Leguminosa', cal: 116, p: 9, c: 20, f: 0.4, tags: ['principal'] },
  { name: 'Grão-de-bico cozido', category: 'Leguminosa', cal: 164, p: 9, c: 27, f: 2.6, tags: ['principal'] },
  { name: 'Ervilha cozida', category: 'Leguminosa', cal: 81, p: 5, c: 14, f: 0.4, tags: ['principal'] },

  // Frutas
  { name: 'Banana prata', category: 'Frutas', cal: 98, p: 1.3, c: 26, f: 0.1, un: 'unidade', amountPerUn: 80, tags: ['cafe', 'lanche'] },
  { name: 'Maçã', category: 'Frutas', cal: 52, p: 0.3, c: 14.1, f: 0.2, un: 'unidade', amountPerUn: 130, tags: ['cafe', 'lanche'] },
  { name: 'Pera', category: 'Frutas', cal: 57, p: 0.4, c: 15, f: 0.1, un: 'unidade', amountPerUn: 130, tags: ['cafe', 'lanche'] },
  { name: 'Laranja', category: 'Frutas', cal: 47, p: 0.9, c: 12, f: 0.1, un: 'unidade', amountPerUn: 130, tags: ['cafe', 'lanche'] },
  { name: 'Morango', category: 'Frutas', cal: 30, p: 0.9, c: 6.8, f: 0.3, tags: ['cafe', 'lanche'] },
  { name: 'Mamão papaia', category: 'Frutas', cal: 40, p: 0.5, c: 10.4, f: 0.1, un: 'porção', amountPerUn: 150, tags: ['cafe', 'lanche'] },
  { name: 'Melão', category: 'Frutas', cal: 29, p: 0.7, c: 7.5, f: 0.1, tags: ['cafe', 'lanche'] },
  { name: 'Uva', category: 'Frutas', cal: 69, p: 0.7, c: 18, f: 0.2, tags: ['cafe', 'lanche'] },
  { name: 'Manga', category: 'Frutas', cal: 60, p: 0.8, c: 15, f: 0.4, tags: ['cafe', 'lanche'] },

  // Vegetais
  { name: 'Salada verde', category: 'Vegetais', cal: 15, p: 1, c: 2, f: 0, tags: ['principal'] },
  { name: 'Legumes variados', category: 'Vegetais', cal: 35, p: 2, c: 7, f: 0, tags: ['principal'] },
  { name: 'Brócolis cozido', category: 'Vegetais', cal: 35, p: 2.8, c: 7, f: 0.4, tags: ['principal'] },
  { name: 'Cenoura cozida', category: 'Vegetais', cal: 35, p: 0.8, c: 8, f: 0.2, tags: ['principal'] },
  { name: 'Abobrinha cozida', category: 'Vegetais', cal: 17, p: 1.2, c: 3.1, f: 0.3, tags: ['principal'] },
  { name: 'Berinjela cozida', category: 'Vegetais', cal: 25, p: 1, c: 6, f: 0.2, tags: ['principal'] },
  { name: 'Couve refogada', category: 'Vegetais', cal: 49, p: 3.3, c: 8.8, f: 0.7, tags: ['principal'] },
  { name: 'Tomate', category: 'Vegetais', cal: 18, p: 0.9, c: 3.9, f: 0.2, tags: ['principal', 'cafe', 'lanche'] },

  // Gorduras / extras
  { name: 'Azeite de oliva', category: 'Gorduras', cal: 884, p: 0, c: 0, f: 100, un: 'colher de sopa', amountPerUn: 10, tags: ['principal'] },
  { name: 'Pasta de amendoim', category: 'Gorduras', cal: 588, p: 25, c: 20, f: 50, un: 'colher de sopa', amountPerUn: 15, tags: ['cafe', 'lanche'] },
  { name: 'Amendoim', category: 'Gorduras', cal: 567, p: 26, c: 16, f: 49, tags: ['lanche'] },
  { name: 'Castanhas', category: 'Gorduras', cal: 600, p: 15, c: 20, f: 52, tags: ['lanche'] },
  { name: 'Abacate', category: 'Gorduras', cal: 160, p: 2, c: 9, f: 15, tags: ['cafe', 'lanche'] },
  { name: 'Homus', category: 'Gorduras', cal: 166, p: 8, c: 14, f: 10, un: 'colher de sopa', amountPerUn: 30, tags: ['lanche', 'cafe', 'principal'] },

  // Lanches / extras
  { name: 'Pipoca (milho p/ estourar)', category: 'Carboidratos do café', cal: 360, p: 10, c: 70, f: 4, un: 'gramas', amountPerUn: 1, tags: ['lanche'] },
  { name: 'Mel', category: 'Carboidratos do café', cal: 304, p: 0.3, c: 82, f: 0, un: 'colher de sopa', amountPerUn: 15, tags: ['cafe', 'lanche'] },
  { name: 'Geleia sem açúcar', category: 'Carboidratos do café', cal: 120, p: 0, c: 30, f: 0, un: 'colher de sopa', amountPerUn: 20, tags: ['cafe', 'lanche'] },

  // Vegetarianos / veganos
  { name: 'Tofu grelhado', category: 'Proteína Principal', cal: 120, p: 12, c: 3, f: 7, tags: ['principal', 'lanche'] },
  { name: 'Proteína de soja', category: 'Proteína Principal', cal: 320, p: 50, c: 30, f: 1, tags: ['principal'] },
  { name: 'Tempeh', category: 'Proteína Principal', cal: 193, p: 19, c: 9, f: 11, tags: ['principal'] },
  { name: 'Bebida de aveia', category: 'Bebidas', cal: 45, p: 1, c: 8, f: 1.5, un: 'copo', amountPerUn: 200, tags: ['cafe'] },
  { name: 'Bebida de amêndoas', category: 'Bebidas', cal: 25, p: 0.5, c: 1, f: 2, un: 'copo', amountPerUn: 200, tags: ['cafe'] },
  { name: 'Leite de soja', category: 'Bebidas', cal: 40, p: 3.3, c: 3, f: 1.8, un: 'copo', amountPerUn: 200, tags: ['cafe'] },

    // Sucos naturais — base aproximada por 100ml
  { name: 'Suco de laranja natural', category: 'Sucos naturais', cal: 45, p: 0.7, c: 10.4, f: 0.2, un: 'copo', amountPerUn: 200, tags: ['suco', 'bebida', 'cafe', 'lanche'] },
  { name: 'Suco de limão sem açúcar', category: 'Sucos naturais', cal: 8, p: 0.2, c: 2.5, f: 0, un: 'copo', amountPerUn: 200, tags: ['suco', 'bebida', 'cafe', 'lanche'] },
  { name: 'Suco de maracujá sem açúcar', category: 'Sucos naturais', cal: 35, p: 0.6, c: 8.4, f: 0.1, un: 'copo', amountPerUn: 200, tags: ['suco', 'bebida', 'lanche'] },
  { name: 'Suco de abacaxi sem açúcar', category: 'Sucos naturais', cal: 40, p: 0.4, c: 10, f: 0.1, un: 'copo', amountPerUn: 200, tags: ['suco', 'bebida', 'lanche'] },
  { name: 'Suco de melancia sem açúcar', category: 'Sucos naturais', cal: 30, p: 0.6, c: 7.5, f: 0.1, un: 'copo', amountPerUn: 200, tags: ['suco', 'bebida', 'lanche'] },
  { name: 'Suco de uva integral', category: 'Sucos naturais', cal: 61, p: 0.3, c: 15, f: 0.1, un: 'copo', amountPerUn: 200, tags: ['suco', 'bebida', 'lanche'] },
  { name: 'Suco de acerola sem açúcar', category: 'Sucos naturais', cal: 32, p: 0.7, c: 7.8, f: 0.1, un: 'copo', amountPerUn: 200, tags: ['suco', 'bebida', 'lanche'] },
  { name: 'Suco verde', category: 'Sucos naturais', cal: 28, p: 0.8, c: 6, f: 0.2, un: 'copo', amountPerUn: 250, tags: ['suco', 'bebida', 'lanche'], recipe: ['Couve', 'Limão', 'Maçã', 'Água gelada'], prep: 'Bata tudo no liquidificador e beba sem coar para manter mais fibras.', portionNote: '1 copo de 250ml' },
  { name: 'Suco de laranja com cenoura', category: 'Sucos naturais', cal: 42, p: 0.7, c: 9.8, f: 0.1, un: 'copo', amountPerUn: 250, tags: ['suco', 'bebida', 'lanche'], recipe: ['Laranja', 'Cenoura', 'Água'], prep: 'Bata ou esprema a laranja e misture com cenoura batida.', portionNote: '1 copo de 250ml' },
  { name: 'Suco de laranja com beterraba', category: 'Sucos naturais', cal: 44, p: 0.8, c: 10.2, f: 0.1, un: 'copo', amountPerUn: 250, tags: ['suco', 'bebida', 'lanche'], recipe: ['Laranja', 'Beterraba', 'Água'], prep: 'Bata os ingredientes e sirva gelado.', portionNote: '1 copo de 250ml' },
  { name: 'Suco de abacaxi com hortelã', category: 'Sucos naturais', cal: 38, p: 0.4, c: 9.5, f: 0.1, un: 'copo', amountPerUn: 250, tags: ['suco', 'bebida', 'lanche'], recipe: ['Abacaxi', 'Hortelã', 'Água gelada'], prep: 'Bata no liquidificador e evite adicionar açúcar.', portionNote: '1 copo de 250ml' },

  // Vitaminas e smoothies — base aproximada por 100ml
  { name: 'Vitamina de banana com leite', category: 'Vitaminas', cal: 72, p: 2.8, c: 13, f: 1.2, un: 'copo', amountPerUn: 250, isLactose: true, tags: ['vitamina', 'cafe', 'lanche'], recipe: ['Banana prata', 'Leite desnatado'], prep: 'Bata 1 banana com 200ml de leite.', portionNote: '1 copo de 250ml' },
  { name: 'Vitamina de banana com aveia', category: 'Vitaminas', cal: 92, p: 3.4, c: 17, f: 1.7, un: 'copo', amountPerUn: 250, isLactose: true, tags: ['vitamina', 'cafe', 'lanche'], recipe: ['Banana prata', 'Leite desnatado', 'Aveia em flocos'], prep: 'Bata 1 banana, 200ml de leite e 20g de aveia.', portionNote: '1 copo de 250ml' },
  { name: 'Vitamina de mamão com leite', category: 'Vitaminas', cal: 62, p: 2.5, c: 11, f: 1.0, un: 'copo', amountPerUn: 250, isLactose: true, tags: ['vitamina', 'cafe', 'lanche'], recipe: ['Mamão papaia', 'Leite desnatado'], prep: 'Bata mamão com leite gelado.', portionNote: '1 copo de 250ml' },
  { name: 'Smoothie de morango com iogurte', category: 'Vitaminas', cal: 58, p: 3.5, c: 8, f: 1.3, un: 'copo', amountPerUn: 250, isLactose: true, tags: ['vitamina', 'cafe', 'lanche'], recipe: ['Morango', 'Iogurte natural', 'Gelo'], prep: 'Bata morango com iogurte e gelo.', portionNote: '1 copo de 250ml' },
  { name: 'Smoothie proteico de banana', category: 'Vitaminas', cal: 105, p: 9, c: 13, f: 1.5, un: 'copo', amountPerUn: 300, isLactose: true, isSupplement: true, tags: ['vitamina', 'lanche', 'suplemento'], recipe: ['Banana prata', 'Whey Protein', 'Leite desnatado'], prep: 'Bata 1 banana, 200ml de leite e 25g de whey.', portionNote: '1 copo de 300ml' },
  { name: 'Shake de whey com água', category: 'Suplementos', cal: 130, p: 26, c: 2, f: 1.5, un: 'dose', amountPerUn: 35, isSupplement: true, tags: ['lanche', 'suplemento'], recipe: ['Whey Protein', 'Água'], prep: 'Misture 30g a 35g de whey com água.', portionNote: '1 dose' },
  { name: 'Shake de whey com leite', category: 'Suplementos', cal: 95, p: 11, c: 7, f: 2, un: 'copo', amountPerUn: 250, isLactose: true, isSupplement: true, tags: ['lanche', 'suplemento'], recipe: ['Whey Protein', 'Leite desnatado'], prep: 'Misture whey com leite gelado.', portionNote: '1 copo de 250ml' },

  // Bolos e doces fitness — valores aproximados por 100g
  { name: 'Bolo fitness de banana com aveia', category: 'Receitas fitness', cal: 185, p: 6, c: 29, f: 5, un: 'fatia', amountPerUn: 70, isEgg: true, tags: ['bolo', 'cafe', 'lanche', 'doce'], recipe: ['Banana madura', 'Aveia em flocos', 'Ovo de galinha', 'Canela', 'Fermento'], prep: 'Amasse banana, misture aveia, ovo, canela e fermento. Asse até firmar.', portionNote: '1 fatia média de 70g' },
  { name: 'Bolo fitness de maçã com canela', category: 'Receitas fitness', cal: 175, p: 5, c: 28, f: 4.5, un: 'fatia', amountPerUn: 70, isEgg: true, tags: ['bolo', 'cafe', 'lanche', 'doce'], recipe: ['Maçã', 'Aveia em flocos', 'Ovo de galinha', 'Canela', 'Fermento'], prep: 'Misture maçã picada, aveia, ovo e canela. Asse em forma pequena.', portionNote: '1 fatia média de 70g' },
  { name: 'Bolo fitness de cenoura', category: 'Receitas fitness', cal: 210, p: 6, c: 30, f: 7, un: 'fatia', amountPerUn: 70, isEgg: true, tags: ['bolo', 'cafe', 'lanche', 'doce'], recipe: ['Cenoura', 'Aveia em flocos', 'Ovo de galinha', 'Adoçante culinário', 'Fermento'], prep: 'Bata cenoura com ovos, misture aveia e fermento. Asse até dourar.', portionNote: '1 fatia média de 70g' },
  { name: 'Bolo proteico de chocolate', category: 'Receitas fitness', cal: 220, p: 13, c: 24, f: 7, un: 'fatia', amountPerUn: 70, isEgg: true, isSupplement: true, tags: ['bolo', 'lanche', 'doce', 'suplemento'], recipe: ['Whey Protein', 'Aveia em flocos', 'Ovo de galinha', 'Cacau em pó', 'Fermento'], prep: 'Misture whey, aveia, ovo, cacau e fermento. Asse ou faça no micro-ondas.', portionNote: '1 fatia média de 70g' },
  { name: 'Brownie fitness de banana', category: 'Doces fitness', cal: 230, p: 8, c: 32, f: 8, un: 'porção', amountPerUn: 60, isEgg: true, tags: ['doce', 'lanche', 'sobremesa'], recipe: ['Banana madura', 'Cacau em pó', 'Aveia em flocos', 'Ovo de galinha'], prep: 'Misture tudo e asse em forma pequena até ficar firme.', portionNote: '1 pedaço de 60g' },
  { name: 'Panqueca de banana com aveia', category: 'Receitas fitness', cal: 190, p: 8, c: 28, f: 5, un: 'unidade', amountPerUn: 100, isEgg: true, tags: ['cafe', 'lanche', 'panqueca'], recipe: ['Banana prata', 'Ovo de galinha', 'Aveia em flocos', 'Canela'], prep: 'Amasse banana, misture com ovo e aveia. Doure em frigideira antiaderente.', portionNote: '1 panqueca média' },
  { name: 'Panqueca proteica', category: 'Receitas fitness', cal: 210, p: 18, c: 20, f: 6, un: 'unidade', amountPerUn: 100, isEgg: true, isSupplement: true, tags: ['cafe', 'lanche', 'panqueca', 'suplemento'], recipe: ['Whey Protein', 'Ovo de galinha', 'Banana prata', 'Aveia em flocos'], prep: 'Misture tudo e doure em frigideira antiaderente.', portionNote: '1 panqueca média' },
  { name: 'Muffin de banana com aveia', category: 'Receitas fitness', cal: 195, p: 6, c: 30, f: 5, un: 'unidade', amountPerUn: 60, isEgg: true, tags: ['cafe', 'lanche', 'bolo'], recipe: ['Banana madura', 'Aveia em flocos', 'Ovo de galinha', 'Fermento'], prep: 'Misture os ingredientes e asse em forminhas.', portionNote: '1 muffin de 60g' },
  { name: 'Cookie de aveia fit', category: 'Doces fitness', cal: 240, p: 7, c: 34, f: 8, un: 'unidade', amountPerUn: 35, isEgg: true, tags: ['lanche', 'doce'], recipe: ['Aveia em flocos', 'Banana madura', 'Pasta de amendoim', 'Canela'], prep: 'Misture tudo, modele cookies e asse até firmar.', portionNote: '1 cookie grande de 35g' },
  { name: 'Brigadeiro fit de cacau', category: 'Doces fitness', cal: 180, p: 5, c: 24, f: 7, un: 'unidade', amountPerUn: 25, isLactose: true, tags: ['doce', 'sobremesa'], recipe: ['Leite em pó desnatado', 'Cacau em pó', 'Adoçante', 'Água'], prep: 'Misture até formar massa cremosa e modele.', portionNote: '1 unidade pequena de 25g' },
  { name: 'Mousse proteico de chocolate', category: 'Doces fitness', cal: 135, p: 12, c: 10, f: 4, un: 'porção', amountPerUn: 120, isLactose: true, isSupplement: true, tags: ['doce', 'lanche', 'suplemento'], recipe: ['Iogurte grego light', 'Whey Protein', 'Cacau em pó'], prep: 'Misture tudo e deixe gelar.', portionNote: '1 porção de 120g' },
  { name: 'Overnight oats', category: 'Receitas fitness', cal: 160, p: 7, c: 25, f: 4, un: 'pote', amountPerUn: 180, isLactose: true, tags: ['cafe', 'lanche'], recipe: ['Aveia em flocos', 'Iogurte natural', 'Banana prata', 'Canela'], prep: 'Misture em um pote e deixe na geladeira de um dia para o outro.', portionNote: '1 pote de 180g' },
  { name: 'Chia pudding', category: 'Receitas fitness', cal: 145, p: 5, c: 14, f: 8, un: 'pote', amountPerUn: 150, tags: ['cafe', 'lanche'], recipe: ['Chia', 'Leite vegetal', 'Fruta'], prep: 'Misture chia com leite vegetal e deixe gelar até engrossar.', portionNote: '1 pote de 150g' },

  // Ingredientes de receitas
  { name: 'Cacau em pó', category: 'Carboidratos do café', cal: 228, p: 20, c: 58, f: 14, un: 'colher de sopa', amountPerUn: 10, tags: ['cafe', 'lanche', 'doce'] },
  { name: 'Canela em pó', category: 'Carboidratos do café', cal: 247, p: 4, c: 81, f: 1.2, un: 'colher de chá', amountPerUn: 3, tags: ['cafe', 'lanche'] },
  { name: 'Chia', category: 'Gorduras', cal: 486, p: 17, c: 42, f: 31, un: 'colher de sopa', amountPerUn: 12, tags: ['cafe', 'lanche'] },
  { name: 'Linhaça', category: 'Gorduras', cal: 534, p: 18, c: 29, f: 42, un: 'colher de sopa', amountPerUn: 10, tags: ['cafe', 'lanche'] },
  { name: 'Leite em pó desnatado', category: 'Laticínios', cal: 360, p: 36, c: 52, f: 1, un: 'colher de sopa', amountPerUn: 10, isLactose: true, tags: ['cafe', 'lanche', 'doce'] },
  { name: 'Adoçante culinário', category: 'Carboidratos do café', cal: 20, p: 0, c: 5, f: 0, un: 'colher de sopa', amountPerUn: 10, tags: ['doce', 'receita'] },
  { name: 'Fermento químico', category: 'Carboidratos do café', cal: 53, p: 0, c: 28, f: 0, un: 'colher de chá', amountPerUn: 5, tags: ['receita'] },

  // Café da manhã / lanches adicionais
  { name: 'Pão de queijo pequeno', category: 'Café da manhã', cal: 330, p: 6, c: 38, f: 17, un: 'unidade', amountPerUn: 30, isLactose: true, tags: ['cafe', 'lanche'] },
  { name: 'Tapioca com queijo minas', category: 'Receitas fitness', cal: 220, p: 8, c: 32, f: 6, un: 'unidade', amountPerUn: 100, isLactose: true, tags: ['cafe', 'lanche'], recipe: ['Tapioca (goma)', 'Queijo minas frescal'], prep: 'Prepare a tapioca na frigideira e recheie com queijo minas.', portionNote: '1 unidade média' },
  { name: 'Tapioca com banana e canela', category: 'Receitas fitness', cal: 205, p: 2, c: 47, f: 0.5, un: 'unidade', amountPerUn: 120, tags: ['cafe', 'lanche'], recipe: ['Tapioca (goma)', 'Banana prata', 'Canela em pó'], prep: 'Prepare a tapioca e recheie com banana e canela.', portionNote: '1 unidade média' },
  { name: 'Sanduíche natural de frango', category: 'Receitas fitness', cal: 180, p: 13, c: 24, f: 4, un: 'unidade', amountPerUn: 140, isGluten: true, isLactose: true, tags: ['lanche'], recipe: ['Pão integral', 'Frango desfiado', 'Requeijão light', 'Cenoura'], prep: 'Misture frango com requeijão e cenoura. Monte no pão integral.', portionNote: '1 sanduíche' },
  { name: 'Sanduíche natural de atum', category: 'Receitas fitness', cal: 170, p: 14, c: 22, f: 3, un: 'unidade', amountPerUn: 140, isGluten: true, isLactose: true, tags: ['lanche'], recipe: ['Pão integral', 'Atum em lata (água)', 'Requeijão light', 'Tomate'], prep: 'Misture atum com requeijão e tomate. Monte no pão integral.', portionNote: '1 sanduíche' },
  { name: 'Wrap de frango', category: 'Receitas fitness', cal: 190, p: 15, c: 22, f: 5, un: 'unidade', amountPerUn: 160, isGluten: true, isLactose: true, tags: ['lanche'], recipe: ['Wrap integral', 'Frango desfiado', 'Requeijão light', 'Salada verde'], prep: 'Recheie o wrap com frango, requeijão e salada.', portionNote: '1 wrap' },
  { name: 'Wrap de homus com salada', category: 'Receitas fitness', cal: 175, p: 6, c: 25, f: 6, un: 'unidade', amountPerUn: 160, isGluten: true, tags: ['lanche', 'vegetariano'], recipe: ['Wrap integral', 'Homus', 'Salada verde', 'Tomate'], prep: 'Passe homus no wrap e acrescente salada e tomate.', portionNote: '1 wrap' },
  { name: 'Omelete simples', category: 'Receitas fitness', cal: 160, p: 13, c: 2, f: 11, un: 'unidade', amountPerUn: 100, isEgg: true, tags: ['cafe', 'principal'], recipe: ['Ovo de galinha', 'Tomate', 'Salada verde'], prep: 'Bata os ovos e doure em frigideira antiaderente.', portionNote: '1 omelete médio' },
  { name: 'Omelete com queijo minas', category: 'Receitas fitness', cal: 190, p: 15, c: 2, f: 13, un: 'unidade', amountPerUn: 120, isEgg: true, isLactose: true, tags: ['cafe', 'principal'], recipe: ['Ovo de galinha', 'Queijo minas frescal', 'Tomate'], prep: 'Misture ovos, queijo e tomate. Doure em frigideira antiaderente.', portionNote: '1 omelete médio' },

  // Pratos principais adicionais
  { name: 'Frango xadrez fit', category: 'Receitas fitness', cal: 140, p: 18, c: 8, f: 4, un: 'porção', amountPerUn: 250, tags: ['principal'], recipe: ['Peito de Frango grelhado', 'Legumes variados', 'Molho shoyu light'], prep: 'Refogue frango em cubos com legumes e pouco shoyu.', portionNote: '1 porção de 250g' },
  { name: 'Strogonoff fit de frango', category: 'Receitas fitness', cal: 155, p: 18, c: 7, f: 6, un: 'porção', amountPerUn: 220, isLactose: true, tags: ['principal'], recipe: ['Peito de Frango grelhado', 'Iogurte natural', 'Tomate'], prep: 'Prepare o frango com molho de tomate e finalize com iogurte.', portionNote: '1 porção de 220g' },
  { name: 'Escondidinho fit de frango', category: 'Receitas fitness', cal: 150, p: 14, c: 18, f: 3, un: 'porção', amountPerUn: 250, tags: ['principal'], recipe: ['Frango desfiado', 'Mandioca cozida', 'Tomate'], prep: 'Monte camadas de mandioca amassada e frango desfiado. Leve ao forno.', portionNote: '1 porção de 250g' },
  { name: 'Escondidinho fit de carne', category: 'Receitas fitness', cal: 175, p: 14, c: 17, f: 7, un: 'porção', amountPerUn: 250, tags: ['principal'], recipe: ['Patinho moído', 'Mandioca cozida', 'Tomate'], prep: 'Monte camadas de mandioca amassada e patinho refogado. Leve ao forno.', portionNote: '1 porção de 250g' },
  { name: 'Almôndega de patinho assada', category: 'Receitas fitness', cal: 190, p: 24, c: 4, f: 8, un: 'unidade', amountPerUn: 50, isEgg: true, tags: ['principal'], recipe: ['Patinho moído', 'Ovo de galinha', 'Aveia em flocos'], prep: 'Misture os ingredientes, modele e asse.', portionNote: '1 unidade de 50g' },
  { name: 'Hambúrguer caseiro de patinho', category: 'Receitas fitness', cal: 210, p: 28, c: 1, f: 10, un: 'unidade', amountPerUn: 100, tags: ['principal', 'lanche'], recipe: ['Patinho moído', 'Temperos naturais'], prep: 'Modele o patinho temperado e grelhe.', portionNote: '1 unidade de 100g' },
  { name: 'Salada de grão-de-bico com atum', category: 'Receitas fitness', cal: 145, p: 12, c: 16, f: 4, un: 'porção', amountPerUn: 220, tags: ['principal', 'lanche'], recipe: ['Grão-de-bico cozido', 'Atum em lata (água)', 'Tomate', 'Salada verde'], prep: 'Misture tudo e tempere com limão.', portionNote: '1 porção de 220g' },
  { name: 'Bowl de frango com quinoa', category: 'Receitas fitness', cal: 150, p: 15, c: 16, f: 4, un: 'porção', amountPerUn: 250, tags: ['principal'], recipe: ['Peito de Frango grelhado', 'Quinoa cozida', 'Legumes variados'], prep: 'Monte uma tigela com quinoa, frango e legumes.', portionNote: '1 bowl de 250g' },
  { name: 'Bowl vegetariano de tofu', category: 'Receitas fitness', cal: 135, p: 10, c: 15, f: 5, un: 'porção', amountPerUn: 250, tags: ['principal', 'vegetariano'], recipe: ['Tofu grelhado', 'Arroz integral cozido', 'Legumes variados'], prep: 'Grelhe o tofu e sirva com arroz integral e legumes.', portionNote: '1 bowl de 250g' },
  { name: 'Macarrão integral com atum', category: 'Receitas fitness', cal: 160, p: 13, c: 22, f: 3, un: 'porção', amountPerUn: 250, isGluten: true, tags: ['principal'], recipe: ['Macarrão integral', 'Atum em lata (água)', 'Tomate'], prep: 'Misture macarrão cozido com atum e molho de tomate simples.', portionNote: '1 prato de 250g' },

  // Mais vegetais e bases
  { name: 'Abóbora cozida', category: 'Vegetais', cal: 48, p: 1.4, c: 12, f: 0.1, tags: ['principal'] },
  { name: 'Chuchu cozido', category: 'Vegetais', cal: 19, p: 0.7, c: 4.8, f: 0.1, tags: ['principal'] },
  { name: 'Vagem cozida', category: 'Vegetais', cal: 35, p: 1.9, c: 7.9, f: 0.2, tags: ['principal'] },
  { name: 'Couve-flor cozida', category: 'Vegetais', cal: 25, p: 2, c: 5, f: 0.3, tags: ['principal'] },
  { name: 'Pepino', category: 'Vegetais', cal: 15, p: 0.7, c: 3.6, f: 0.1, tags: ['principal', 'lanche'] },
  { name: 'Alface', category: 'Vegetais', cal: 14, p: 1.4, c: 2.9, f: 0.2, tags: ['principal', 'lanche'] },
  { name: 'Rúcula', category: 'Vegetais', cal: 25, p: 2.6, c: 3.7, f: 0.7, tags: ['principal', 'lanche'] },
  { name: 'Cebola', category: 'Vegetais', cal: 40, p: 1.1, c: 9.3, f: 0.1, tags: ['principal'] },
  { name: 'Pimentão', category: 'Vegetais', cal: 27, p: 1, c: 6, f: 0.2, tags: ['principal'] },

  // Bebidas adicionais
  { name: 'Água de coco', category: 'Bebidas', cal: 19, p: 0.7, c: 3.7, f: 0.2, un: 'copo', amountPerUn: 200, tags: ['bebida', 'lanche'] },
  { name: 'Chá sem açúcar', category: 'Bebidas', cal: 1, p: 0, c: 0.2, f: 0, un: 'xícara', amountPerUn: 200, tags: ['bebida', 'cafe', 'lanche'] },
  { name: 'Café com leite desnatado', category: 'Bebidas', cal: 25, p: 1.8, c: 3, f: 0.2, un: 'xícara', amountPerUn: 200, isLactose: true, tags: ['bebida', 'cafe'] },
];

export const FOODS = FOOD_DATABASE;