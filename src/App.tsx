/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { 
  Coffee, Sun, Moon, Apple, CloudMoon, Footprints, Gauge, Dumbbell, 
  Bike, Shield, Activity, Smile, Utensils, IceCream, Heart, Zap, Plus, 
  Info, Minus, ChevronDown, ChevronUp, Search, X, Check, Flame, Trophy,
  Calendar, MessageSquare, Rocket, Star, ThumbsUp as ThumbsUpIcon,
  Book, PlusCircle, Users, User, LayoutGrid, Shuffle, Sliders, Settings, AlertCircle, ShieldCheck,
  Smartphone, Share, ChevronRight, Sparkles, UserPlus, Share2, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MobileFrame } from './components/MobileFrame';
import { MEAL_CONFIGS, type MealConfig, type MealCount } from './data/mealConfigs';
import { BASE_CALS, INT_MULT, INTENSITIES, WORKOUT_TYPES, type Intensity, type WorkoutType } from './data/workouts';
import { CATEGORIES, FOOD_DATABASE, FOODS, type FoodItem } from './data/foods';
import { formatKcal, formatMacro, safeNumber, scrollToTop } from './utils/formatters';
import { CHECKIN_OPTIONS, QUICK_MSGS, SUBSTITUTIONS } from './data/social';
import { ProgressBar } from './components/ProgressBar';
import { Logo } from './components/Logo';
import { C } from './data/theme';
import type { AppCtx, Meal, MealEntry, UserProfile, Workout } from './types';
import { INIT_MEALS } from './data/demo';
import {
  PORTION_LIMITS,
  MAIN_MEAL_PROTEINS,
  SUPPLEMENTS,
  BREAKFAST_ONLY_OR_COMPLEMENTARY,
  FREE_PORTION_FOODS,
  sanitizeOptionQtyText,
  orderMealQtyText,
  applySmartBadges,
  removeDuplicateMealOptions,
} from './data/mealRules';
import { resolveFoodName } from './data/foodAliases';
import { FITNESS_RECIPES, type FitnessRecipe } from './data/recipes';
// ─── TYPES ────────────────────────────────────────────────────────────────────

const MEAL_STRICT_LIMITS: Record<string, { max: number; unit: string }> = {
  'Pão integral': { max: 2, unit: 'fatia' },
  'Pão francês': { max: 1, unit: 'unidade' },
  'Tapioca (goma)': { max: 50, unit: 'g' },
  'Aveia em flocos': { max: 40, unit: 'g' },
  'Ovo de galinha': { max: 3, unit: 'unidade' },
  'Clara de ovo': { max: 4, unit: 'unidade' },
  'Manteiga': { max: 10, unit: 'g' },
  'Requeijão light': { max: 40, unit: 'g' },
  'Queijo minas frescal': { max: 60, unit: 'g' },
  'Arroz branco cozido': { max: 150, unit: 'g' },
  'Arroz integral cozido': { max: 150, unit: 'g' },
  'Feijão preto cozido': { max: 120, unit: 'g' },
  'Feijão carioca cozido': { max: 120, unit: 'g' },
  'Macarrão integral': { max: 180, unit: 'g' },
  'Batata inglesa cozida': { max: 250, unit: 'g' },
  'Batata-doce cozida': { max: 250, unit: 'g' },
  'Inhame cozido': { max: 250, unit: 'g' },
  'Mandioca cozida': { max: 220, unit: 'g' },
  'Peito de Frango grelhado': { max: 220, unit: 'g' },
  'Patinho moído': { max: 220, unit: 'g' },
  'Tilápia grelhada': { max: 220, unit: 'g' },
  'Carne magra grelhada': { max: 220, unit: 'g' },
  'Legumes variados': { max: 250, unit: 'g' },
  'Salada verde': { max: 150, unit: 'g' },
  'Azeite de oliva': { max: 10, unit: 'g' },
  'Iogurte natural': { max: 170, unit: 'g' },
  'Morango': { max: 150, unit: 'g' },
  'Banana prata': { max: 1, unit: 'unidade' },
  'Maçã': { max: 1, unit: 'unidade' },
  'Mamão papaia': { max: 200, unit: 'g' },
  'Iogurte grego': { max: 1, unit: 'pote' },
  'Whey Protein': { max: 30, unit: 'g' },
  'Melão': { max: 180, unit: 'g' },
  'Laranja': { max: 1, unit: 'unidade' },
};


const formatUnit = (qty: number, singular: string, plural: string) => {
  if (qty <= 1) return `1 ${singular}`;
  // Handle complex plurals
  if (singular.includes(' ')) {
    const parts = singular.split(' ');
    const first = parts[0];
    const rest = parts.slice(1).join(' ');
    // Ex: "ponta de faca" -> "pontas de faca"
    const firstPlural = first.endsWith('r') ? first + 'es' : (first.endsWith('m') ? first.slice(0, -1) + 'ns' : (first.endsWith('a') || first.endsWith('e') || first.endsWith('o') ? first + 's' : first + 'es'));
    return `${qty} ${firstPlural} ${rest}`;
  }
  return `${qty} ${plural}`;
};

const getDisplayUnit = (qty: number, unit: string) => {
  const u = unit.toLowerCase();
  if (u.includes('gramas') || u === 'g') return `${qty}g`;
  if (u.includes('unidade')) return formatUnit(qty, 'unidade', 'unidades');
  if (u.includes('fatia')) return formatUnit(qty, 'fatia', 'fatias');
  if (u.includes('colher de sopa')) return formatUnit(qty, 'colher de sopa', 'colheres de sopa');
  if (u.includes('colher de chá')) return formatUnit(qty, 'colher de chá', 'colheres de chá');
  if (u.includes('colher')) return formatUnit(qty, 'colher', 'colheres');
  if (u.includes('porção')) return formatUnit(qty, 'porção', 'porções');
  if (u.includes('pote')) return formatUnit(qty, 'pote', 'potes');
  return `${qty} ${unit}`;
};

const formatQuantity = (qty: number, unit: string) => {
  return getDisplayUnit(qty, unit);
};
const normalizePlanText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getApproxGramsFromPlanLine = (line: string, food: FoodItem) => {
  const match = line.match(
    /(\d+(?:[.,]\d+)?)\s*(colheres de sopa|colher de sopa|colheres de chá|colher de chá|colheres|colher|xícaras|xícara|xicaras|xicara|copos|copo|doses|dose|porções|porção|porcoes|porcao|potes|pote|fatias|fatia|unidades|unidade|un|gramas|g|ml)/i
  );

  if (!match) return 0;

  const amount = Number(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();

  if (!Number.isFinite(amount) || amount <= 0) return 0;

  if (unit === 'g' || unit === 'gramas' || unit === 'ml') {
    return amount;
  }

  if (unit.includes('colher de sopa')) {
    return amount * (food.amountPerUn || 15);
  }

  if (unit.includes('colher de chá')) {
    return amount * (food.amountPerUn || 5);
  }

  if (unit.includes('colher')) {
    return amount * (food.amountPerUn || 15);
  }

  if (unit.includes('copo')) {
    return amount * (food.amountPerUn || 200);
  }

  if (unit.includes('xicara') || unit.includes('xícara')) {
    return amount * (food.amountPerUn || 200);
  }

  if (unit.includes('dose')) {
    return amount * (food.amountPerUn || 35);
  }

  if (
    unit.includes('porcao') ||
    unit.includes('porção') ||
    unit.includes('porcoes') ||
    unit.includes('porções')
  ) {
    return amount * (food.amountPerUn || 100);
  }

  if (unit.includes('pote')) {
    return amount * (food.amountPerUn || 170);
  }

  if (unit.includes('fatia')) {
    return amount * (food.amountPerUn || 30);
  }

  if (unit.includes('un')) {
    return amount * (food.amountPerUn || 100);
  }

  return 0;
};

const getPlanOptionMacros = (qtyText: string) => {
  const normalizeMacroText = (value: string = '') =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const findFoodInLine = (line: string) => {
    const normalizedLine = normalizeMacroText(line);

    return [...FOOD_DATABASE]
      .sort((a, b) => b.name.length - a.name.length)
      .find(food => normalizedLine.includes(normalizeMacroText(food.name)));
  };

  const lines = sanitizeOptionQtyText(qtyText || '')
    .split(' + ')
    .map(line => line.trim())
    .filter(Boolean);

  const totals = lines.reduce(
    (acc, line) => {
      const food = findFoodInLine(line);

      if (!food) return acc;

      const grams = getApproxGramsFromPlanLine(line, food);

      if (!grams || grams <= 0) return acc;

      const factor = grams / 100;

      acc.p += safeNumber(food.p) * factor;
      acc.c += safeNumber(food.c) * factor;
      acc.f += safeNumber(food.f) * factor;

      return acc;
    },
    { p: 0, c: 0, f: 0 }
  );

  return {
    p: Math.round(totals.p),
    c: Math.round(totals.c),
    f: Math.round(totals.f),
  };
};

const getPlanOptionSignature = (option: any) => {
  const title = normalizePlanText(option?.name || '');
  const qty = normalizePlanText(
    sanitizeOptionQtyText(option?.qty || '')
      .replace(/\d+(?:[.,]\d+)?\s*(g|unidade|unidades|un|fatia|fatias|pote|potes|colher de sopa|colheres de sopa|colher|colheres)/gi, '')
  );

  return `${title}|${qty}`;
};
const RECIPE_LIBRARY = {
  cafe: [
    { title: 'Pão francês com manteiga', items: ['Pão francês', 'Manteiga'] },
    { title: 'Pão francês com manteiga e ovos', items: ['Pão francês', 'Manteiga', 'Ovo de galinha'] },
    { title: 'Pão integral com manteiga', items: ['Pão integral', 'Manteiga'] },
    { title: 'Pão integral com requeijão e ovos', items: ['Pão integral', 'Requeijão light', 'Ovo de galinha'] },
    { title: 'Pão integral com queijo minas e fruta', items: ['Pão integral', 'Queijo minas frescal', 'Frutas'] },
    { title: 'Tapioca com queijo e fruta', items: ['Tapioca (goma)', 'Queijo minas frescal', 'Frutas'] },
    { title: 'Iogurte com aveia e morango', items: ['Iogurte natural', 'Aveia em flocos', 'Morango'] },
    { title: 'Panqueca de banana com aveia', items: ['Banana prata', 'Aveia em flocos', 'Ovo de galinha'] },
    { title: 'Fruta com aveia e mel', items: ['Mamão papaia', 'Aveia em flocos', 'Mel'] },
    { title: 'Tapioca com ovos', items: ['Tapioca (goma)', 'Ovo de galinha'] },
    { title: 'Pão integral com ovos', items: ['Pão integral', 'Ovo de galinha'] },
  ],
  main: [
    { title: 'Arroz, feijão preto e frango', items: ['Arroz branco cozido', 'Feijão preto cozido', 'Peito de Frango grelhado', 'Salada verde'] },
    { title: 'Macarrão com carne moída e legumes', items: ['Macarrão integral', 'Patinho moído', 'Legumes variados'] },
    { title: 'Arroz, feijão e carne moída', items: ['Arroz branco cozido', 'Feijão preto cozido', 'Patinho moído', 'Salada verde'] },
    { title: 'Batata com frango e salada', items: ['Batata inglesa cozida', 'Peito de Frango grelhado', 'Salada verde'] },
    { title: 'Peixe com batata e legumes', items: ['Tilápia grelhada', 'Batata inglesa cozida', 'Legumes variados'] },
    { title: 'Arroz com feijão, frango e legumes', items: ['Arroz integral cozido', 'Feijão preto cozido', 'Peito de Frango grelhado', 'Legumes variados'] },
  ],
  snacks: [
    { title: 'Sanduíche de frango', items: ['Pão integral', 'Peito de Frango grelhado', 'Requeijão light'] },
    { title: 'Sanduíche de atum', items: ['Pão integral', 'Atum em lata (água)', 'Requeijão light'] },
    { title: 'Iogurte com fruta e aveia', items: ['Iogurte natural', 'Frutas', 'Aveia em flocos'] },
    { title: 'Pipoca com frango desfiado', items: ['Pipoca (milho p/ estourar)', 'Peito de Frango grelhado'] },
    { title: 'Fruta com iogurte', items: ['Frutas', 'Iogurte natural'] },
    { title: 'Queijo minas com fruta', items: ['Queijo minas frescal', 'Frutas'] },
    { title: 'Iogurte com whey e fruta', items: ['Iogurte natural', 'Whey Protein', 'Frutas'] },
    { title: 'Batata-doce com frango', items: ['Batata-doce cozida', 'Peito de Frango grelhado'] },
    { title: 'Banana com mel e aveia', items: ['Banana prata', 'Aveia em flocos', 'Mel'] },
  ],
  jantar: [
    { title: 'Arroz, feijão preto, frango e salada', items: ['Arroz branco cozido', 'Feijão preto cozido', 'Peito de Frango grelhado', 'Salada verde'] },
    { title: 'Inhame, carne magra e legumes', items: ['Inhame cozido', 'Carne magra grelhada', 'Legumes variados'] },
    { title: 'Omelete com salada e batata', items: ['Ovo de galinha', 'Salada verde', 'Batata inglesa cozida'] },
    { title: 'Peixe com batata e legumes', items: ['Tilápia grelhada', 'Batata inglesa cozida', 'Legumes variados'] },
    { title: 'Frango com mandioca e salada', items: ['Peito de Frango grelhado', 'Mandioca cozida', 'Salada verde'] },
    { title: 'Patinho com arroz e legumes', items: ['Patinho moído', 'Arroz branco cozido', 'Legumes variados'] },
    
    // Veg/Vegan options
    { title: 'Arroz, feijão e tofu grelhado', items: ['Arroz integral cozido', 'Feijão preto cozido', 'Tofu grelhado', 'Salada verde'] },
    { title: 'Batata com lentilha e salada', items: ['Batata inglesa cozida', 'Lentilha cozida', 'Salada verde'] },
    { title: 'Cuscuz com grão-de-bico e legumes', items: ['Cuscuz de milho cozido', 'Grão-de-bico cozido', 'Legumes variados'] },
  ]
};

// ─── FOOD DATABASE ────────────────────────────────────────────────────────────



const MEAL_TEMPLATES = {
  cafe: [
    { type: 'Café da manhã', pct: 0.6, name: 'Base' },
    { type: 'Proteína Leve', pct: 0.3, name: 'Acompanhamento' },
    { type: 'Frutas', pct: 0.1, name: 'Fruta' }
  ],
  main: [
    { type: 'Carboidratos principais', pct: 0.4, name: 'Principal' },
    { type: 'Proteína Principal', pct: 0.4, name: 'Proteína' },
    { type: 'Leguminosa', pct: 0.1, name: 'Leguminosa' },
    { type: 'Vegetais', pct: 0.1, name: 'Salada/Legumes' }
  ],
  snacks: [
    { type: 'Proteína Leve', pct: 0.5, name: 'Proteína/Laticínio' },
    { type: 'Carboidratos do café', pct: 0.5, name: 'Carbo/Fruta' }
  ],
  jantar: [
    { type: 'Proteína Principal', pct: 0.5, name: 'Proteína' },
    { type: 'Carboidratos principais', pct: 0.3, name: 'Carbo' },
    { type: 'Vegetais', pct: 0.2, name: 'Salada/Legumes' }
  ]
};

const ALIASES: Record<string, string> = {
  'cuzcuz': 'Cuscuz de milho',
  'cuscuz': 'Cuscuz de milho',
  'cuscuz milho': 'Cuscuz de milho',
  'pao': 'Pão francês',
  'pao frances': 'Pão francês',
  'pao integrl': 'Pão integral',
  'pao integral': 'Pão integral',
  'mantega': 'Manteiga',
  'manteiga': 'Manteiga',
  'requeijao': 'Requeijão light',
  'requeijao light': 'Requeijão light',
  'queijo': 'Queijo minas frescal',
  'queijo minas': 'Queijo minas frescal',
  'frango': 'Peito de Frango grelhado',
  'frango grelhado': 'Peito de Frango grelhado',
  'carne moida': 'Patinho moído',
  'patinho': 'Patinho moído',
  'batata doce': 'Batata-doce cozida',
  'batata-doce': 'Batata-doce cozida',
  'macarrao': 'Macarrão integral',
  'macarrao integral': 'Macarrão integral',
  'arroz': 'Arroz branco cozido',
  'feijao': 'Feijão preto cozido',
  'feijão preto': 'Feijão preto cozido',
  'feijao preto': 'Feijão preto cozido',
  'ovo': 'Ovo de galinha',
  'ovos': 'Ovo de galinha',
  'tapioca': 'Tapioca (goma)',
};
const ALIASES_FUZZY = ALIASES;

const findFuzzyMatch = (input: string) => {
  const normalized = input.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
  
  if (ALIASES[normalized]) return ALIASES[normalized];
  
  // Basic substring match or fuzzy logic
  const bestMatch = FOOD_DATABASE.find(f => {
    const fN = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return fN.includes(normalized) || normalized.includes(fN);
  });
  
  return bestMatch?.name || null;
};


// ─── CIRCULO CONSTANTS ────────────────────────────────────────────────────────


const DAILY_TIPS = [
  "Priorize proteína nas refeições principais.",
  "Deixe frutas fáceis de pegar.",
  "Água ajuda a controlar beliscos por impulso.",
  "Planeje o lanche antes da fome apertar.",
  "Comer devagar ajuda na saciedade.",
  "Vegetais aumentam volume com poucas calorias.",
  "Evite chegar ao jantar com muita fome.",
  "Um dia fora da rotina não estraga o progresso.",
  "Repetir refeições simples facilita a constância.",
  "Sono ruim pode aumentar a fome no dia seguinte.",
  "Comece pelo básico bem feito.",
  "Tenha uma opção rápida para emergências.",
  "Não precisa perfeição; precisa consistência.",
  "Proteína no café pode ajudar na saciedade.",
  "Escolha um lanche planejado para evitar beliscos.",
  "Café sem açúcar quase não altera suas calorias.",
  "Acompanhe tendências, não apenas um dia isolado.",
  "Um treino não precisa liberar exageros.",
  "Ajuste amanhã, sem culpa.",
  "O que você consegue repetir vale mais que o perfeito.",
  "Proteínas e fibras são as chaves da saciedade.",
  "Não beba suas calorias com frequência.",
  "Foco na qualidade dos alimentos, não só números.",
  "O peso oscila; foque na sua aderência.",
  "Caminhar 10 min após comer ajuda a digestão.",
  "Frutas cítricas ajudam na absorção de ferro.",
  "Prepare o café da manhã na noite anterior.",
  "Cuidado com 'molhos saudáveis' muito calóricos.",
  "O equilíbrio é melhor que a restrição severa.",
  "Descansar também faz parte do seu resultado."
];

const getDailyTip = () => {
  const day = new Date().getDate();
  return DAILY_TIPS[day % DAILY_TIPS.length];
};

const REACTIONS = [
  { key: 'boa', label: 'Boa!', icon: ThumbsUpIcon },
  { key: 'mandou', label: 'Mandou bem', icon: Rocket },
  { key: 'bora', label: 'Bora!', icon: Flame },
  { key: 'top', label: 'Top', icon: Star },
];


// ─── PLAN DATA ────────────────────────────────────────────────────────────────

const PLAN_OPTIONS: Record<string, { name: string; qty: string; cal: number }[]> = {
  cafe: [
    { name: 'Aveia com banana e mel', qty: 'Aveia 60g + banana 1un', cal: 322 },
    { name: 'Ovos mexidos com pão integral', qty: '3 ovos + 2 fatias pão', cal: 360 },
    { name: 'Iogurte grego com granola', qty: 'Iogurte 200g + granola 40g', cal: 340 },
  ],
  lancheManha: [
    { name: 'Frutas com iogurte', qty: 'Maçã 1un + iogurte 100g', cal: 155 },
    { name: 'Torrada com manteiga de amendoim', qty: '2 fatias + 15g', cal: 210 },
    { name: 'Mix de castanhas', qty: 'Castanhas 30g', cal: 170 },
  ],
  almoco: [
    { name: 'Frango grelhado com arroz e brócolis', qty: 'Frango 150g + arroz 100g + brócolis 80g', cal: 520 },
    { name: 'Salmão com batata-doce e salada', qty: 'Salmão 120g + batata-doce 120g', cal: 490 },
    { name: 'Tilápia com feijão e arroz', qty: 'Tilápia 150g + feijão 80g + arroz 80g', cal: 510 },
  ],
  lanche: [
    { name: 'Iogurte grego com granola', qty: 'Iogurte 150g + granola 30g', cal: 287 },
    { name: 'Maçã com manteiga de amendoim', qty: 'Maçã 1un + 20g', cal: 210 },
    { name: 'Whey com leite', qty: 'Whey 30g + leite desnatado 200ml', cal: 200 },
  ],
  jantar: [
    { name: 'Omelete de cottage com salada', qty: '3 ovos + cottage 50g', cal: 310 },
    { name: 'Frango com legumes no vapor', qty: 'Frango 130g + legumes 150g', cal: 290 },
    { name: 'Atum com batata-doce e alface', qty: 'Atum 120g + batata-doce 80g', cal: 300 },
  ],
  ceia: [
    { name: 'Iogurte natural com mel', qty: 'Iogurte 150g + mel 10g', cal: 120 },
    { name: 'Leite morno com canela', qty: 'Leite desnatado 200ml', cal: 70 },
    { name: 'Cottage com frutas vermelhas', qty: 'Cottage 80g + morangos 50g', cal: 100 },
  ],
};

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const Ctx = createContext<AppCtx | null>(null);

// ─── RESTRICTION MAPPING ──────────────────────────────────────────────────────
const RESTRICTION_MAPPING: Record<string, string[]> = {
  'leite': [
    'leite', 'iogurte', 'iogurte natural', 'iogurte desnatado', 'queijo', 'queijo minas', 
    'queijo cottage', 'cottage', 'requeijão', 'requeijão light', 'manteiga', 'whey'
  ],
  'lactose': [
    'leite integral', 'leite desnatado', 'queijo minas frescal', 'queijo cottage', 
    'iogurte natural', 'requeijão light', 'manteiga'
  ],
  'ovo': [
    'ovo', 'ovo de galinha', 'clara', 'clara de ovo', 'omelete', 'crepioca', 'panqueca'
  ],
  'glúten': [
    'pão francês', 'pão integral', 'macarrão integral', 'trigo', 'aveia'
  ],
  'peixes': [
    'peixe', 'tilápia', 'salmão', 'sardinha', 'atum'
  ],
  'crustáceos': [
    'camarão', 'caranguejo', 'lagosta', 'frutos do mar'
  ],
  'frutos do mar': [
    'camarão', 'caranguejo', 'lagosta', 'frutos do mar', 'peixe', 'tilápia', 'salmão', 'sardinha', 'atum'
  ],
  'amendoim': [
    'amendoim', 'pasta de amendoim'
  ],
  'castanhas/nozes': [
    'castanhas', 'nozes', 'amêndoas', 'mix de nuts', 'granola'
  ],
  'soja': [
    'soja', 'proteína de soja', 'tofu', 'leite de soja'
  ]
};

const normalizeRestrictionText = (value: string = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeRestrictionKey = (value: string = '') => {
  const key = normalizeRestrictionText(value).replace(/^sem\s+/, '').trim();

  if (key === 'lactose') return 'leite';
  if (key === 'leite') return 'leite';
  if (key === 'ovo') return 'ovo';
  if (key === 'ovos') return 'ovo';
  if (key === 'gluten') return 'gluten';
  if (key === 'peixe') return 'peixes';
  if (key === 'peixes') return 'peixes';
  if (key === 'amendoim') return 'amendoim';
  if (key === 'castanhas') return 'castanhas/nozes';
  if (key === 'nozes') return 'castanhas/nozes';
  if (key === 'soja') return 'soja';

  return key;
};

const RESTRICTION_TERMS: Record<string, string[]> = {
  leite: [
    'leite',
    'iogurte',
    'queijo',
    'cottage',
    'ricota',
    'requeijao',
    'manteiga',
    'cream cheese',
    'whey',
    'vitamina',
    'shake com leite',
    'cafe com leite',
  ],

  ovo: [
    'ovo',
    'ovos',
    'clara',
    'clara de ovo',
    'omelete',
    'crepioca',
    'panqueca',
    'bolo fitness',
    'bolo proteico',
    'brownie',
    'muffin',
    'cookie',
  ],

  gluten: [
    'pao',
    'pão',
    'macarrao',
    'macarrão',
    'trigo',
    'wrap',
    'torrada',
    'bolo',
    'cookie',
    'muffin',
    'panqueca',
    'aveia',
  ],

  peixes: [
    'peixe',
    'tilapia',
    'tilápia',
    'atum',
    'sardinha',
    'salmao',
    'salmão',
    'frutos do mar',
    'camarao',
    'camarão',
  ],

  amendoim: [
    'amendoim',
    'pasta de amendoim',
  ],

  'castanhas/nozes': [
    'castanhas',
    'nozes',
    'amendoas',
    'amêndoas',
    'mix de nuts',
    'granola',
  ],

  soja: [
    'soja',
    'proteina de soja',
    'proteína de soja',
    'tofu',
    'leite de soja',
    'bebida de soja',
  ],
};

const isFoodRestricted = (foodName: string, userProfile: UserProfile | null) => {
  if (!userProfile) return false;

  const rawText = String(foodName || '');

  const matchedFood = [...FOOD_DATABASE]
    .sort((a, b) => b.name.length - a.name.length)
    .find(food => normalizeRestrictionText(rawText).includes(normalizeRestrictionText(food.name)));

  const extraRecipeText = matchedFood
    ? [
        matchedFood.name,
        ...(matchedFood.recipe || []),
        matchedFood.prep || '',
        matchedFood.portionNote || '',
      ].join(' ')
    : '';

  const text = normalizeRestrictionText(`${rawText} ${extraRecipeText}`);

  const userRestrictions = (userProfile.restrictions || [])
    .filter(Boolean)
    .map(normalizeRestrictionKey)
    .filter(key => key !== 'nenhuma');

  const blockedFoods = userProfile.blockedFoods || [];
  const dietaryProfile = userProfile.dietaryProfile || 'sem_restricao';

  if (
    blockedFoods.some(blocked => {
      const b = normalizeRestrictionText(blocked);
      return text === b || text.includes(b);
    })
  ) {
    return true;
  }

  if (dietaryProfile === 'vegetariano') {
    const meat = [
      'frango',
      'carne',
      'patinho',
      'peixe',
      'atum',
      'tilapia',
      'tilápia',
      'sobrecoxa',
      'sardinha',
      'camarao',
      'camarão',
    ];

    if (meat.some(term => text.includes(normalizeRestrictionText(term)))) {
      return true;
    }
  }

  if (dietaryProfile === 'vegano') {
    const animal = [
      'frango',
      'carne',
      'patinho',
      'peixe',
      'atum',
      'tilapia',
      'tilápia',
      'sobrecoxa',
      'sardinha',
      'camarao',
      'camarão',
      'ovo',
      'ovos',
      'clara',
      'leite',
      'iogurte',
      'queijo',
      'cottage',
      'ricota',
      'requeijao',
      'manteiga',
      'whey',
      'mel',
    ];

    if (animal.some(term => text.includes(normalizeRestrictionText(term)))) {
      return true;
    }
  }

  if (dietaryProfile === 'pescetariano') {
    const meat = ['frango', 'carne', 'patinho', 'sobrecoxa'];

    if (meat.some(term => text.includes(normalizeRestrictionText(term)))) {
      return true;
    }
  }

  return userRestrictions.some(restrictionKey => {
    const terms = RESTRICTION_TERMS[restrictionKey] || [restrictionKey];

    if (restrictionKey === 'leite' && matchedFood?.isLactose) return true;
    if (restrictionKey === 'ovo' && matchedFood?.isEgg) return true;
    if (restrictionKey === 'gluten' && matchedFood?.isGluten) return true;

    return terms.some(term => text.includes(normalizeRestrictionText(term)));
  });
};

function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp fora do provider');
  return c;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<Record<string, { meals: Meal[], workouts: Workout[] }>>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const dateKey = selectedDate.toDateString();
  const todayData = history[dateKey] || { meals: [], workouts: [] };
  const meals = todayData.meals;
  const workouts = todayData.workouts;

  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [mealCount, setMealCount] = useState<MealCount>(4);
  const [pendingMealType, setPendingMealType] = useState<string | null>(null);
  const [pendingEditMealId, setPendingEditMealId] = useState<string | null>(null);
  const [myCheckin, setMyCheckin] = useState('Estou bem');
  const [mealPlan, setMealPlan] = useState<Record<string, { name: string; qty: string; cal: number; badge?: string; badgeDesc?: string }[]>>({});
  const [selectedCircleId, setSelectedCircleId] = useState('group1');

  const updateHistory = (newMeals: Meal[], newWorkouts: Workout[]) => {
    setHistory(prev => ({
      ...prev,
      [dateKey]: { meals: newMeals, workouts: newWorkouts }
    }));
  };

  const addMeal = (m: Omit<Meal, 'id'>) => {
    const newMeals = [...meals, { ...m, id: Date.now().toString() }];
    updateHistory(newMeals, workouts);
  };

  const updateMeal = (id: string, m: Partial<Meal>) => {
    const newMeals = meals.map(item => item.id === id ? { ...item, ...m } : item);
    updateHistory(newMeals, workouts);
  };

  const deleteMeal = (id: string) => {
    const newMeals = meals.filter(item => item.id !== id);
    updateHistory(newMeals, workouts);
  };

  const addWorkout = (w: Workout) => {
    const newWorkouts = [...workouts, w];
    updateHistory(meals, newWorkouts);
  };

  const deleteWorkout = (id: string) => {
    const newWorkouts = workouts.filter(item => item.id !== id);
    updateHistory(meals, newWorkouts);
  };

  const addCustomFood = (f: FoodItem) => setCustomFoods(prev => [...prev, f]);

  const setMeals = (newMeals: Meal[]) => {
    updateHistory(newMeals, workouts);
  };

  const setWorkouts = (newWorkouts: Workout[]) => {
    updateHistory(meals, newWorkouts);
  };

  const calorieGoal = useMemo(() => {
    if (!userProfile) return 1800;
    
    const weight = safeNumber(userProfile.weight, 70);
    const height = safeNumber(userProfile.height, 170);
    const age = safeNumber(userProfile.age, 25);
    
    // BMR Mifflin-St Jeor
    let bmr = 10 * weight + 6.25 * height - 5 * age + (userProfile.gender === 'masculino' ? 5 : -161);
    
    // Activity based on trainings per week
    const activityMult = 1.2 + (userProfile.trainingsPerWeek * 0.05); // 0 = 1.2, 3 = 1.35, 7 = 1.55
    let tdee = bmr * activityMult;
    
    let goal = tdee;
    if (userProfile.goal === 'perda') goal = tdee * 0.8; // 20% deficit
    else if (userProfile.goal === 'ganho') goal = tdee * 1.15; // 15% surplus
    
    return Math.round(safeNumber(goal, 1800));
  }, [userProfile]);

  const macros = useMemo(() => {
    const goal = safeNumber(calorieGoal, 1800);
    // Approx 30% P, 40% C, 30% F
    const p = Math.round((goal * 0.3) / 4);
    const c = Math.round((goal * 0.4) / 4);
    const f = Math.round((goal * 0.3) / 9);
    return { p: safeNumber(p, 135), c: safeNumber(c, 180), f: safeNumber(f, 60) };
  }, [calorieGoal]);


  const getTotals = () =>
    meals.reduce((acc, m) => ({
      cal: acc.cal + m.cal, p: acc.p + m.p,
      c: acc.c + m.c, f: acc.f + m.f,
    }), { cal: 0, p: 0, c: 0, f: 0 });

  const estimateBurned = (type: WorkoutType, dur: number, intensity: Intensity) => {
    const weight = userProfile?.weight || 70;
    return Math.round((BASE_CALS[type] ?? 5) * (INT_MULT[intensity] ?? 1) * (weight / 70) * dur);
  };

  const login = (email: string) => {
    setIsLoggedIn(true);
    // If demo, we want to go to screening with empty fields or default values
    if (email === 'demo@test.com') {
      setUserProfile(null); // Ensure fresh start
      setOnboarded(false);
    }
  };
  
  const signup = (email: string) => {
    setIsLoggedIn(true);
    setOnboarded(false);
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const updateProfile = (p: Partial<UserProfile>) => {
  setUserProfile(prev => {
    if (!prev) return null;

    const nextProfile = { ...prev, ...p };

    if (typeof p.mealCount === 'number') {
      setMealCount(p.mealCount);
    }

    return nextProfile;
  });
};

  const handleProfileUpdate = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const next = { ...prev, ...profile };
      
      if (profile.mealCount) {
        setMealCount(profile.mealCount as MealCount);
      }
      
      // The useEffect will trigger generateNewPlan since we add dependencies
      return next;
    });
  };

  useEffect(() => {
    if (onboarded && userProfile) {
      generateNewPlan();
    }
  }, [
    userProfile?.mealCount, 
    userProfile?.goal, 
    userProfile?.trainingsPerWeek, 
    userProfile?.weight, 
    userProfile?.mealStyles,
    userProfile?.restrictions,
    userProfile?.preferredIngredients,
    onboarded
  ]);

 const getMealOptions = (targetCal: number, profile: UserProfile, mealKey?: string) => {
  const safeMealKey = mealKey || 'lanche';

  const isMainMeal = safeMealKey === 'almoco' || safeMealKey === 'jantar';
  const isSnack = safeMealKey.includes('lanche') || safeMealKey === 'ceia';
  const isBreakfast = safeMealKey === 'cafe';

  const templateKey = isBreakfast
    ? 'cafe'
    : isMainMeal
    ? safeMealKey === 'jantar'
      ? 'jantar'
      : 'main'
    : 'snacks';

  let prefKey: 'breakfast' | 'main' | 'snacks' = 'snacks';

  if (isBreakfast) prefKey = 'breakfast';
  else if (isMainMeal) prefKey = 'main';

  const userPrefs = (profile.preferredIngredients?.[prefKey] || [])
    .filter(Boolean)
    .map(item => String(item));

  const mealStyle = (profile.mealStyles?.[safeMealKey] || 'balanced') as 'balanced' | 'simple';
  const normalizeLocal = (value: string = '') =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const cleanComponentName = (value: string = '') =>
    normalizeLocal(value)
      .replace(/\d+(?:[.,]\d+)?\s*(g|gramas|unidade|unidades|un|fatia|fatias|pote|potes|colher de sopa|colheres de sopa|colher|colheres)/gi, '')
      .replace(/\ba vontade\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

  const foodName = (food: any) => normalizeLocal(food?.name || '');

  const forbiddenBreakfastTerms = [
    'peito de frango',
    'frango',
    'patinho',
    'carne',
    'tilapia',
    'atum',
    'sardinha',
    'salmao',
    'sobrecoxa',
    'proteina de soja',
  ];

  const forbiddenMainProteinTerms = [
    'whey',
    'achocolatado',
    'clara de ovo',
    'iogurte',
    'leite',
    'queijo minas',
    'queijo cottage',
    'cottage',
    'requeijao',
  ];

  const mainProteinTerms = [
    'frango',
    'patinho',
    'carne magra',
    'tilapia',
    'atum',
    'sardinha',
    'salmao',
    'tofu',
    'lentilha',
    'grao-de-bico',
    'proteina de soja',
    'ovo de galinha',
  ];

  const carbTerms = [
    'arroz',
    'batata',
    'batata-doce',
    'macarrao',
    'mandioca',
    'inhame',
    'cuscuz',
    'pao',
    'tapioca',
    'aveia',
  ];

  const isWeirdBreakfastFood = (name: string) => {
    const normalized = normalizeLocal(name);

    return forbiddenBreakfastTerms.some(term => normalized.includes(term));
  };

  const isBadMainProtein = (name: string) => {
    const normalized = normalizeLocal(name);

    return forbiddenMainProteinTerms.some(term => normalized.includes(term));
  };

  const countsAsRealMainProtein = (food: any) => {
    const name = foodName(food);

    if (!name) return false;
    if (isBadMainProtein(name)) return false;

    return (
      food?.category === 'Proteína Principal' ||
      mainProteinTerms.some(term => name.includes(term))
    );
  };

  const getFoodOptionsForRecipeItem = (itemName: string) => {
    const normalizedItem = normalizeLocal(itemName);

    let options = FOOD_DATABASE.filter(f => {
      const sameName = normalizeLocal(f.name) === normalizedItem;
      const sameCategory = normalizeLocal(f.category) === normalizedItem;
      const fruitCategory = normalizedItem === 'frutas' && normalizeLocal(f.category) === 'frutas';

      return sameName || sameCategory || fruitCategory;
    });

    if (options.length === 0) {
      options = FOOD_DATABASE.filter(f => {
        const tags = f.tags || [];
        const category = normalizeLocal(f.category || '');

        return (
          tags.some((tag: string) => normalizeLocal(tag).includes(normalizedItem)) ||
          category.includes(normalizedItem)
        );
      });
    }

    options = options.filter(f => !isFoodRestricted(f.name, profile));

    if (isBreakfast) {
      options = options.filter(f => !isWeirdBreakfastFood(f.name));
    }

    if (isMainMeal) {
      options = options.filter(f => !normalizeLocal(f.name).includes('whey'));
      options = options.filter(f => !normalizeLocal(f.name).includes('achocolatado'));
    }

    return options;
  };

  let availableFoods = FOOD_DATABASE.filter(f => !isFoodRestricted(f.name, profile));

  if (isBreakfast) {
    availableFoods = availableFoods.filter(f => !isWeirdBreakfastFood(f.name));
  }

  if (isMainMeal) {
    availableFoods = availableFoods.filter(f => !normalizeLocal(f.name).includes('whey'));
    availableFoods = availableFoods.filter(f => !normalizeLocal(f.name).includes('achocolatado'));
  }

  if (availableFoods.length === 0) {
    availableFoods = FOOD_DATABASE;
  }

  const extraMainRecipes = [
    {
      title: 'Arroz, feijão e tofu grelhado',
      items: ['Arroz integral cozido', 'Feijão preto cozido', 'Tofu grelhado', 'Salada verde'],
    },
    {
      title: 'Batata com lentilha e salada',
      items: ['Batata inglesa cozida', 'Lentilha cozida', 'Salada verde'],
    },
    {
      title: 'Cuscuz com grão-de-bico e legumes',
      items: ['Cuscuz de milho cozido', 'Grão-de-bico cozido', 'Legumes variados'],
    },
  ];

  const baseRecipes = RECIPE_LIBRARY[templateKey as keyof typeof RECIPE_LIBRARY] || [];
  const recipes = isMainMeal ? [...baseRecipes, ...extraMainRecipes] : baseRecipes;

  const validRecipes = recipes.filter(recipe => {
    if (mealStyle === 'simple' && recipe.items.length > 3) {
      return false;
    }

    if (isBreakfast && recipe.items.some(item => isWeirdBreakfastFood(item))) {
      return false;
    }

    return recipe.items.every(itemName => {
      if (isFoodRestricted(itemName, profile)) return false;

      const options = getFoodOptionsForRecipeItem(itemName);

      return options.length > 0 || normalizeLocal(itemName).includes('salada verde');
    });
  });

  const pool = validRecipes.length > 0 ? validRecipes : recipes;

  const getOptionComponents = (option: any) =>
    sanitizeOptionQtyText(option?.qty || '')
      .split(' + ')
      .map(part => cleanComponentName(part))
      .filter(Boolean);

  const getOptionSignature = (option: any) =>
    getOptionComponents(option).sort().join('|');

  const getMainProteinFromOption = (option: any) => {
    const text = normalizeLocal(`${option?.name || ''} ${option?.qty || ''}`);

    const found = mainProteinTerms.find(term => text.includes(term));

    return found || '';
  };

  const getMainCarbFromOption = (option: any) => {
    const text = normalizeLocal(`${option?.name || ''} ${option?.qty || ''}`);

    const found = carbTerms.find(term => text.includes(term));

    return found || '';
  };

  const optionsAreTooSimilar = (a: any, b: any) => {
    const aComponents = new Set(getOptionComponents(a));
    const bComponents = new Set(getOptionComponents(b));

    const intersection = [...aComponents].filter(component => bComponents.has(component)).length;
    const union = new Set([...aComponents, ...bComponents]).size;
    const overlap = union === 0 ? 0 : intersection / union;

    const sameTitle = normalizeLocal(a?.name || '') === normalizeLocal(b?.name || '');
    const sameSignature = getOptionSignature(a) === getOptionSignature(b);

    const sameProteinAndCarb =
      getMainProteinFromOption(a) !== '' &&
      getMainCarbFromOption(a) !== '' &&
      getMainProteinFromOption(a) === getMainProteinFromOption(b) &&
      getMainCarbFromOption(a) === getMainCarbFromOption(b);

    return sameTitle || sameSignature || overlap >= 0.55 || sameProteinAndCarb;
  };

  const canAddOption = (option: any, existingOptions: any[]) => {
    if (!option) return false;

    if (isBreakfast && isWeirdBreakfastFood(`${option.name} ${option.qty}`)) {
      return false;
    }

    if (isMainMeal) {
      const text = normalizeLocal(`${option.name} ${option.qty}`);

      if (text.includes('whey') || text.includes('achocolatado')) {
        return false;
      }

      const hasRealProtein = mainProteinTerms.some(term => text.includes(term));

      if (!hasRealProtein) {
        return false;
      }
    }

    return !existingOptions.some(existing => optionsAreTooSimilar(option, existing));
  };

  const applyPortionLimit = (food: any, qty: number, unitType: 'g' | 'un') => {
    const name = food?.name || '';
    const normalized = normalizeLocal(name);
    const strict = MEAL_STRICT_LIMITS[name];

    let finalQty = qty;

    if (unitType === 'un') {
      if (normalized.includes('ovo de galinha')) finalQty = Math.min(finalQty, isBreakfast ? 2 : 3);
      if (normalized.includes('clara de ovo')) finalQty = Math.min(finalQty, 4);

            if (
        strict &&
        ['unidade', 'fatia', 'pote'].includes(strict.unit)
      ) {
        finalQty = Math.min(finalQty, strict.max);
      }

      return Math.max(1, Math.round(finalQty));
    }

    if (normalized.includes('clara de ovo')) finalQty = Math.min(finalQty, 120);
    if (normalized.includes('manteiga')) finalQty = Math.min(finalQty, 10);
    if (normalized.includes('requeijao')) finalQty = Math.min(finalQty, 30);
    if (normalized.includes('whey')) finalQty = Math.min(finalQty, 30);
    if (normalized.includes('lentilha')) finalQty = Math.min(finalQty, 180);
    if (normalized.includes('grao-de-bico')) finalQty = Math.min(finalQty, 180);
    if (normalized.includes('tofu')) finalQty = Math.min(finalQty, 200);
    if (normalized.includes('legumes')) finalQty = Math.max(100, Math.min(finalQty, 250));
    if (normalized.includes('salada')) finalQty = Math.min(finalQty, 150);
    if (normalized.includes('batata')) finalQty = Math.min(finalQty, 250);
    if (normalized.includes('arroz')) finalQty = Math.min(finalQty, 150);
    if (normalized.includes('feijao')) finalQty = Math.min(finalQty, 120);
    if (normalized.includes('macarrao')) finalQty = Math.min(finalQty, 180);
    if (normalized.includes('iogurte natural')) finalQty = Math.min(finalQty, 170);
    if (normalized.includes('iogurte grego')) finalQty = Math.min(finalQty, 170);
    if (normalized.includes('whey')) finalQty = Math.min(finalQty, 30);
    if (normalized.includes('melao')) finalQty = Math.min(finalQty, 180);
    if (normalized.includes('melão')) finalQty = Math.min(finalQty, 180);
    if (normalized.includes('laranja')) finalQty = Math.min(finalQty, 1);

    if (strict && (strict.unit === 'g' || strict.unit === 'gramas')) {
      finalQty = Math.min(finalQty, strict.max);
    }

    return Math.max(10, Math.round(finalQty / 10) * 10);
  };

  const chooseFood = (options: FoodItem[]) => {
    if (options.length === 0) return null;

    const preferred = options.filter(option =>
      userPrefs.some(pref => normalizeLocal(option.name).includes(normalizeLocal(pref)))
    );

    const poolToUse = preferred.length > 0 ? preferred : options;

    return poolToUse[Math.floor(Math.random() * poolToUse.length)];
  };

  const getTargetForFood = (food: any, recipe: any) => {
    const normalized = foodName(food);
    const category = food?.category || '';
    const nonFreeItems = recipe.items.filter((item: string) => !normalizeLocal(item).includes('salada verde'));
    const base = targetCal / Math.max(nonFreeItems.length, 1);

    if (normalizeLocal(category) === normalizeLocal('Proteína Principal')) return targetCal * 0.34;
    if (countsAsRealMainProtein(food) && isMainMeal) return targetCal * 0.30;

    if (normalizeLocal(category) === normalizeLocal('Leguminosa')) return targetCal * 0.16;
    if (normalizeLocal(category) === normalizeLocal('Carboidratos principais')) return targetCal * 0.30;

    if (isBreakfast) {
      if (normalized.includes('pao') || normalized.includes('tapioca') || normalized.includes('cuscuz')) return targetCal * 0.32;
      if (normalized.includes('ovo') || normalizeLocal(category) === normalizeLocal('Proteína Leve')) return targetCal * 0.28;
      if (normalizeLocal(category) === normalizeLocal('Gorduras')) return targetCal * 0.08;
      if (normalizeLocal(category) === normalizeLocal('Frutas')) return targetCal * 0.18;
    }

    if (isSnack) {
      if (normalizeLocal(category) === normalizeLocal('Proteína Leve')) return targetCal * 0.45;
      if (normalizeLocal(category) === normalizeLocal('Frutas')) return targetCal * 0.30;
      if (normalized.includes('pao') || normalized.includes('batata') || normalized.includes('aveia')) return targetCal * 0.35;
    }

    if (normalizeLocal(category) === normalizeLocal('Vegetais')) return targetCal * 0.08;
    if (normalizeLocal(category) === normalizeLocal('Gorduras')) return targetCal * 0.08;

    return base;
  };

  const getOrder = (component: any) => {
    const n = normalizeLocal(component.name);
    const cat = component.food?.category || '';

    if (isBreakfast || isSnack) {
      if (n.includes('pao') || n.includes('tapioca') || n.includes('cuscuz') || n.includes('iogurte')) return 1;
      if (cat === 'Proteína Leve' || n.includes('ovo')) return 2;
      if (cat === 'Gorduras') return 3;
      if (cat === 'Frutas') return 4;
      if (n.includes('cafe') || n.includes('leite')) return 5;
      return 6;
    }

    if (isMainMeal) {
      if (cat === 'Carboidratos principais') return 1;
      if (cat === 'Leguminosa') return 2;
      if (countsAsRealMainProtein(component.food)) return 3;
      if (n.includes('legumes')) return 9;
      if (n.includes('salada')) return 10;
      return 11;
    }

    return 20;
  };

  const buildOptionFromRecipe = (selectedRecipe: any) => {
    const components: {
      name: string;
      display: string;
      cal: number;
      type?: string;
      order?: number;
      food?: any;
    }[] = [];

    let totalCal = 0;
    let hasProtein = false;

    selectedRecipe.items.forEach((itemName: string) => {
      let options = getFoodOptionsForRecipeItem(itemName);

      if (options.length === 0 && normalizeLocal(itemName).includes('salada verde')) {
        const salad = FOOD_DATABASE.find(f => normalizeLocal(f.name).includes('salada verde'));

        if (salad && !isFoodRestricted(salad.name, profile)) {
          options = [salad];
        }
      }

      const selected = chooseFood(options);

      if (!selected) return;

      const nameL = normalizeLocal(selected.name);

      if (nameL.includes('salada verde')) {
        components.push({
          name: selected.name,
          display: `${selected.name} à vontade`,
          cal: 10,
          type: 'vegetais',
          order: 10,
          food: selected,
        });
        totalCal += 10;
        return;
      }

      if (isMainMeal && countsAsRealMainProtein(selected)) {
        hasProtein = true;
      }

      if (!isMainMeal && (selected.category === 'Proteína Leve' || nameL.includes('ovo'))) {
        hasProtein = true;
      }

      const targetCompCal = getTargetForFood(selected, selectedRecipe);
      const selectedCal = Math.max(1, safeNumber(selected.cal, 1));
      const qtyRaw = (targetCompCal / selectedCal) * 100;

      if (selected.un) {
        let qtyFinal = Math.max(1, Math.round(qtyRaw / (selected.amountPerUn || 100)));
        qtyFinal = applyPortionLimit(selected, qtyFinal, 'un');

        const grams = qtyFinal * (selected.amountPerUn || 100);
        const itemCal = selected.cal * (grams / 100);
        const display = getDisplayUnit(qtyFinal, selected.un);

        components.push({
          name: selected.name,
          display: `${selected.name} ${display}`,
          cal: itemCal,
          food: selected,
        });

        totalCal += itemCal;
      } else {
        let qtyFinal = Math.max(10, Math.round(qtyRaw / 10) * 10);

        if (nameL.includes('legumes')) {
          qtyFinal = Math.max(100, Math.min(250, Math.round(qtyRaw / 50) * 50));
        }

        qtyFinal = applyPortionLimit(selected, qtyFinal, 'g');

        const itemCal = selected.cal * (qtyFinal / 100);
        const display = formatQuantity(qtyFinal, 'g');

        components.push({
          name: selected.name,
          display: `${selected.name} ${display}`,
          cal: itemCal,
          food: selected,
          order: nameL.includes('legumes') ? 9 : undefined,
        });

        totalCal += itemCal;
      }
    });

    if (isMainMeal && !hasProtein) {
      const proteinPool = availableFoods.filter(food => {
        if (!countsAsRealMainProtein(food)) return false;
        if (isBadMainProtein(food.name)) return false;

        return true;
      });

      const protein = chooseFood(proteinPool);

      if (protein) {
        const proteinCal = Math.max(1, safeNumber(protein.cal, 1));
        let qty = Math.round(((targetCal * 0.30) / proteinCal) * 100 / 10) * 10;
        qty = applyPortionLimit(protein, Math.max(90, qty), 'g');

        components.push({
          name: protein.name,
          display: `${protein.name} ${formatQuantity(qty, 'g')}`,
          cal: protein.cal * (qty / 100),
          food: protein,
          type: 'proteina',
          order: 3,
        });

        totalCal += protein.cal * (qty / 100);
      }
    }

    const sortedComponents = [...components].sort((a, b) => {
      if (a.order !== undefined || b.order !== undefined) {
        return (a.order || getOrder(a)) - (b.order || getOrder(b));
      }

      return getOrder(a) - getOrder(b);
    });

    if (sortedComponents.length === 0 || totalCal < 50) {
      return null;
    }

    const proteinComponents = sortedComponents.filter(component => {
      if (!component.food) return false;

      if (isMainMeal) {
        return countsAsRealMainProtein(component.food);
      }

      return (
        component.food.category === 'Proteína Principal' ||
        component.food.category === 'Proteína Leve' ||
        normalizeLocal(component.food.name).includes('ovo')
      );
    });

    const proteinCal = proteinComponents.reduce((acc, item) => acc + item.cal, 0);
    const proteinRatio = totalCal > 0 ? proteinCal / totalCal : 0;

    let badge = 'Completa';

    if (mealStyle === 'simple') badge = 'Simples';
    else if (totalCal < targetCal * 0.82) badge = 'Leve';

    const opt = {
      name: selectedRecipe.title,
      qty: sortedComponents.map(component => component.display).join(' + '),
      cal: Math.round(totalCal),
      badge,
      badgeDesc: '',
      proteinRatio,
    };

    return opt;
  };

  const getFallbackOptions = () => {
    if (isBreakfast) {
      return [
        {
          name: 'Pão integral com ovos',
          qty: 'Pão integral 2 fatias + Ovo de galinha 2 unidades',
          cal: 330,
          badge: 'Completa',
          badgeDesc: '',
          proteinRatio: 0.28,
          score: 760,
        },
        {
          name: 'Iogurte com aveia e morango',
          qty: 'Iogurte natural 1 pote + Aveia em flocos 30g + Morango 120g',
          cal: 310,
          badge: 'Leve',
          badgeDesc: '',
          proteinRatio: 0.22,
          score: 730,
        },
        {
          name: 'Tapioca com queijo e fruta',
          qty: 'Tapioca (goma) 50g + Queijo minas frescal 50g + Banana prata 1 unidade',
          cal: 390,
          badge: 'Completa',
          badgeDesc: '',
          proteinRatio: 0.20,
          score: 700,
        },
      ];
    }

    if (safeMealKey === 'almoco') {
      return [
        {
          name: 'Arroz, feijão preto e frango',
          qty: 'Arroz branco cozido 140g + Feijão preto cozido 100g + Peito de Frango grelhado 150g + Salada verde à vontade',
          cal: 555,
          badge: 'Completa',
          badgeDesc: '',
          proteinRatio: 0.34,
          score: 800,
        },
        {
          name: 'Macarrão com carne moída e legumes',
          qty: 'Macarrão integral 160g + Patinho moído 140g + Legumes variados 180g',
          cal: 610,
          badge: 'Completa',
          badgeDesc: '',
          proteinRatio: 0.32,
          score: 760,
        },
        {
          name: 'Peixe com batata e legumes',
          qty: 'Tilápia grelhada 160g + Batata inglesa cozida 220g + Legumes variados 180g',
          cal: 450,
          badge: 'Leve',
          badgeDesc: '',
          proteinRatio: 0.36,
          score: 730,
        },
      ];
    }

    if (safeMealKey === 'jantar') {
      return [
        {
          name: 'Frango com mandioca e salada',
          qty: 'Peito de Frango grelhado 150g + Mandioca cozida 150g + Salada verde à vontade',
          cal: 485,
          badge: 'Completa',
          badgeDesc: '',
          proteinRatio: 0.34,
          score: 790,
        },
        {
          name: 'Inhame, carne magra e legumes',
          qty: 'Inhame cozido 180g + Carne magra grelhada 140g + Legumes variados 180g',
          cal: 520,
          badge: 'Completa',
          badgeDesc: '',
          proteinRatio: 0.32,
          score: 750,
        },
        {
          name: 'Arroz, feijão e tofu grelhado',
          qty: 'Arroz integral cozido 130g + Feijão preto cozido 100g + Tofu grelhado 180g + Salada verde à vontade',
          cal: 500,
          badge: 'Completa',
          badgeDesc: '',
          proteinRatio: 0.25,
          score: 720,
        },
      ];
    }

    return [
      {
        name: 'Iogurte com fruta e aveia',
        qty: 'Iogurte natural 1 pote + Banana prata 1 unidade + Aveia em flocos 20g',
        cal: 280,
        badge: 'Completa',
        badgeDesc: '',
        proteinRatio: 0.22,
        score: 760,
      },
      {
        name: 'Sanduíche de atum',
        qty: 'Pão integral 2 fatias + Atum em lata (água) 1 lata + Requeijão light 20g',
        cal: 360,
        badge: 'Completa',
        badgeDesc: '',
        proteinRatio: 0.35,
        score: 730,
      },
      {
        name: 'Queijo minas com fruta',
        qty: 'Queijo minas frescal 50g + Banana prata 1 unidade',
        cal: 250,
        badge: 'Leve',
        badgeDesc: '',
        proteinRatio: 0.22,
        score: 700,
      },
    ];
  };

  const results: any[] = [];
  const candidatePool: any[] = [];

  for (let i = 0; i < 120; i++) {
    if (pool.length === 0) break;

    const selectedRecipe = pool[Math.floor(Math.random() * pool.length)];
    const opt = buildOptionFromRecipe(selectedRecipe);

    if (!opt) continue;

    const calDiff = Math.abs(opt.cal - targetCal);
    let score = 1000 - calDiff;

    if (opt.proteinRatio >= 0.22 && opt.proteinRatio <= 0.45) score += 110;
    if (isMainMeal && opt.qty.split(' + ').length >= 3) score += 60;
    if (isBreakfast && !isWeirdBreakfastFood(`${opt.name} ${opt.qty}`)) score += 50;
    if (opt.badge === 'Simples' && !isSnack) score -= 80;

    candidatePool.push({ ...opt, score });
  }

  const sortedCandidates = [...candidatePool].sort((a, b) => (b.score || 0) - (a.score || 0));

  for (const candidate of sortedCandidates) {
    if (results.length >= 3) break;

    if (canAddOption(candidate, results)) {
      results.push(candidate);
    }
  }

  for (const fallback of getFallbackOptions()) {
    if (results.length >= 3) break;

    if (canAddOption(fallback, results)) {
      results.push(fallback);
    }
  }

  if (results.length === 0) {
    const basic = isMainMeal
      ? {
          name: 'Arroz, feijão e frango',
          qty: 'Arroz branco cozido 130g + Feijão preto cozido 100g + Peito de Frango grelhado 140g + Salada verde à vontade',
          cal: 520,
          badge: 'Completa',
          badgeDesc: '',
          proteinRatio: 0.34,
          score: 600,
        }
      : {
          name: 'Pão integral com queijo minas',
          qty: 'Pão integral 2 fatias + Queijo minas frescal 50g',
          cal: 300,
          badge: 'Simples',
          badgeDesc: '',
          proteinRatio: 0.22,
          score: 500,
        };

    results.push(basic);
  }

  if (isBreakfast && userPrefs.some(pref => normalizeLocal(pref).includes('cafe'))) {
    const first = results[0];

    if (first && !normalizeLocal(first.qty).includes('cafe')) {
      first.qty += ' + Café sem açúcar 1 xícara';
    }
  }

  const emergencyOptionsByMealKey: Record<string, any[]> = {
  cafe: [
    {
      name: 'Tapioca com banana e canela',
      qty: 'Tapioca (goma) 50g + Banana prata 1 unidade + Canela em pó 1 colher de chá',
      cal: 335,
      badge: 'Completa',
      badgeDesc: '',
      score: 700,
    },
    {
      name: 'Cuscuz com banana e chia',
      qty: 'Cuscuz de milho 120g + Banana prata 1 unidade + Chia 1 colher de sopa',
      cal: 310,
      badge: 'Completa',
      badgeDesc: '',
      score: 690,
    },
    {
      name: 'Pão integral com pasta de amendoim e fruta',
      qty: 'Pão integral 2 fatias + Pasta de amendoim 1 colher de sopa + Maçã 1 unidade',
      cal: 390,
      badge: 'Completa',
      badgeDesc: '',
      score: 680,
    },
    {
      name: 'Pão árabe com homus e tomate',
      qty: 'Pão árabe 1 unidade + Homus 1 colher de sopa + Tomate 80g',
      cal: 330,
      badge: 'Completa',
      badgeDesc: '',
      score: 670,
    },
    {
      name: 'Vitamina de banana com aveia',
      qty: 'Vitamina de banana com aveia 1 copo',
      cal: 230,
      badge: 'Leve',
      badgeDesc: '',
      score: 660,
    },
  ],

  almoco: [
    {
      name: 'Arroz, feijão e frango',
      qty: 'Arroz branco cozido 140g + Feijão preto cozido 100g + Peito de Frango grelhado 150g + Salada verde à vontade',
      cal: 555,
      badge: 'Completa',
      badgeDesc: '',
      score: 700,
    },
    {
      name: 'Peixe com batata e legumes',
      qty: 'Tilápia grelhada 160g + Batata inglesa cozida 220g + Legumes variados 180g',
      cal: 450,
      badge: 'Completa',
      badgeDesc: '',
      score: 690,
    },
    {
      name: 'Patinho com arroz e legumes',
      qty: 'Patinho moído 140g + Arroz branco cozido 120g + Legumes variados 180g',
      cal: 520,
      badge: 'Completa',
      badgeDesc: '',
      score: 680,
    },
    {
      name: 'Arroz, feijão e tofu grelhado',
      qty: 'Arroz integral cozido 130g + Feijão preto cozido 100g + Tofu grelhado 180g + Salada verde à vontade',
      cal: 500,
      badge: 'Completa',
      badgeDesc: '',
      score: 670,
    },
    {
      name: 'Batata com lentilha e salada',
      qty: 'Batata inglesa cozida 250g + Lentilha cozida 160g + Salada verde à vontade',
      cal: 420,
      badge: 'Completa',
      badgeDesc: '',
      score: 660,
    },
  ],

  jantar: [
    {
      name: 'Inhame, carne magra e legumes',
      qty: 'Inhame cozido 180g + Carne magra grelhada 140g + Legumes variados 180g',
      cal: 520,
      badge: 'Completa',
      badgeDesc: '',
      score: 700,
    },
    {
      name: 'Frango com mandioca e salada',
      qty: 'Peito de Frango grelhado 150g + Mandioca cozida 150g + Salada verde à vontade',
      cal: 485,
      badge: 'Completa',
      badgeDesc: '',
      score: 690,
    },
    {
      name: 'Peixe com batata e legumes',
      qty: 'Tilápia grelhada 160g + Batata inglesa cozida 200g + Legumes variados 180g',
      cal: 420,
      badge: 'Leve',
      badgeDesc: '',
      score: 680,
    },
    {
      name: 'Arroz, feijão e tofu grelhado',
      qty: 'Arroz integral cozido 130g + Feijão preto cozido 100g + Tofu grelhado 180g + Salada verde à vontade',
      cal: 500,
      badge: 'Completa',
      badgeDesc: '',
      score: 670,
    },
    {
      name: 'Cuscuz com grão-de-bico e legumes',
      qty: 'Cuscuz de milho cozido 150g + Grão-de-bico cozido 140g + Legumes variados 180g',
      cal: 465,
      badge: 'Completa',
      badgeDesc: '',
      score: 660,
    },
  ],

  lanche: [
    {
      name: 'Pipoca com fruta',
      qty: 'Pipoca (milho p/ estourar) 30g + Maçã 1 unidade',
      cal: 240,
      badge: 'Simples',
      badgeDesc: '',
      score: 700,
    },
    {
      name: 'Tapioca com banana e canela',
      qty: 'Tapioca (goma) 40g + Banana prata 1 unidade + Canela em pó 1 colher de chá',
      cal: 285,
      badge: 'Completa',
      badgeDesc: '',
      score: 690,
    },
    {
      name: 'Pão árabe com homus',
      qty: 'Pão árabe 1 unidade + Homus 1 colher de sopa',
      cal: 285,
      badge: 'Completa',
      badgeDesc: '',
      score: 680,
    },
    {
      name: 'Vitamina de banana com aveia',
      qty: 'Vitamina de banana com aveia 1 copo',
      cal: 230,
      badge: 'Leve',
      badgeDesc: '',
      score: 670,
    },
  ],

  lancheManha: [
    {
      name: 'Fruta com chia',
      qty: 'Maçã 1 unidade + Chia 1 colher de sopa',
      cal: 125,
      badge: 'Leve',
      badgeDesc: '',
      score: 700,
    },
    {
      name: 'Banana com aveia',
      qty: 'Banana prata 1 unidade + Aveia em flocos 20g',
      cal: 155,
      badge: 'Simples',
      badgeDesc: '',
      score: 690,
    },
    {
      name: 'Pipoca simples',
      qty: 'Pipoca (milho p/ estourar) 25g',
      cal: 90,
      badge: 'Leve',
      badgeDesc: '',
      score: 680,
    },
  ],

  ceia: [
    {
      name: 'Chá com fruta',
      qty: 'Chá sem açúcar 1 xícara + Maçã 1 unidade',
      cal: 70,
      badge: 'Leve',
      badgeDesc: '',
      score: 700,
    },
    {
      name: 'Banana com canela',
      qty: 'Banana prata 1 unidade + Canela em pó 1 colher de chá',
      cal: 85,
      badge: 'Leve',
      badgeDesc: '',
      score: 690,
    },
    {
      name: 'Morango com chia',
      qty: 'Morango 150g + Chia 1 colher de sopa',
      cal: 105,
      badge: 'Leve',
      badgeDesc: '',
      score: 680,
    },
  ],
};

const addUniqueOption = (list: any[], option: any) => {
  if (!option) return;

  const fullText = `${option.name || ''} ${option.qty || ''}`;

  if (isFoodRestricted(fullText, profile)) {
    return;
  }

  const alreadyExists = list.some(existing => {
    const sameName = normalizeLocal(existing.name || '') === normalizeLocal(option.name || '');
    const sameSignature = getOptionSignature(existing) === getOptionSignature(option);
    const tooSimilar = optionsAreTooSimilar(existing, option);

    return sameName || sameSignature || tooSimilar;
  });

  if (!alreadyExists) {
    list.push(option);
  }
};

const uniqueFinalOptions: any[] = [];

[...results]
  .sort((a, b) => (b.score || 0) - (a.score || 0))
  .forEach(option => addUniqueOption(uniqueFinalOptions, option));

getFallbackOptions().forEach(option => addUniqueOption(uniqueFinalOptions, option));

const emergencyOptions =
  emergencyOptionsByMealKey[safeMealKey] ||
  emergencyOptionsByMealKey.lanche;

emergencyOptions.forEach(option => addUniqueOption(uniqueFinalOptions, option));

return uniqueFinalOptions.slice(0, 3).map((option, index) => ({
  ...option,
  badge:
    index === 0
      ? 'Recomendada'
      : option.badge === 'Recomendada'
      ? 'Completa'
      : option.badge || 'Completa',
}));
};

  const generateNewPlan = (mealKey?: string) => {
    if (!userProfile) return;
    const count = userProfile.mealCount;
    const configs = MEAL_CONFIGS[count];
    const newPlan = { ...mealPlan };
    
    // Greedy macro compensation
    let calAdjustment = 0;

    configs.forEach(cfg => {
      if (mealKey && cfg.key !== mealKey) return;
      
      let baseTarget = 0;
      if (count === 3) {
        if (cfg.key === 'cafe') baseTarget = calorieGoal * 0.25;
        else if (cfg.key === 'almoco') baseTarget = calorieGoal * 0.40;
        else if (cfg.key === 'jantar') baseTarget = calorieGoal * 0.35;
      } else if (count === 4) {
        if (cfg.key === 'cafe') baseTarget = calorieGoal * 0.25;
        else if (cfg.key === 'almoco') baseTarget = calorieGoal * 0.35;
        else if (cfg.key === 'lanche') baseTarget = calorieGoal * 0.15;
        else if (cfg.key === 'jantar') baseTarget = calorieGoal * 0.25;
      } else if (count === 5) {
        if (cfg.key === 'cafe') baseTarget = calorieGoal * 0.20;
        else if (cfg.key === 'lancheManha') baseTarget = calorieGoal * 0.10;
        else if (cfg.key === 'almoco') baseTarget = calorieGoal * 0.35;
        else if (cfg.key === 'lanche') baseTarget = calorieGoal * 0.15;
        else if (cfg.key === 'jantar') baseTarget = calorieGoal * 0.20;
      } else if (count === 6) {
        if (cfg.key === 'cafe') baseTarget = calorieGoal * 0.18;
        else if (cfg.key === 'lancheManha') baseTarget = calorieGoal * 0.10;
        else if (cfg.key === 'almoco') baseTarget = calorieGoal * 0.30;
        else if (cfg.key === 'lanche') baseTarget = calorieGoal * 0.12;
        else if (cfg.key === 'jantar') baseTarget = calorieGoal * 0.22;
        else if (cfg.key === 'ceia') baseTarget = calorieGoal * 0.08;
      }

      // Apply adjustment from previous meals
      const targetCal = baseTarget + (calAdjustment / (configs.length - (configs.indexOf(cfg) || 0)));
      
      const options = getMealOptions(targetCal, userProfile, cfg.key);
      newPlan[cfg.key] = options;

      // Track how much we deviated (comparing to the first suggestion)
      if (options.length > 0) {
        const diff = baseTarget - options[0].cal;
        calAdjustment += diff;
      }
    });

    setMealPlan(validatePlan(newPlan));
  };

  const validatePlan = (plan: Record<string, any[]>) => {
  const isMainMealKey = (mealKey: string) => mealKey === 'almoco' || mealKey === 'jantar';

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const optionText = (opt: any) => normalizeText(`${opt.name || ''} ${opt.qty || ''}`);

  const hasSupplementInMainMeal = (opt: any) => {
    const text = optionText(opt);

    return SUPPLEMENTS.some(supplement =>
      text.includes(normalizeText(supplement))
    );
  };

  const hasGenericProteinPatch = (opt: any) => {
    const text = optionText(opt);

    return (
      text.includes('proteina principal') ||
      text.includes('frango/carne') ||
      text.includes('refeicao proteica balanceada')
    );
  };

  const hasRealMainProtein = (opt: any) => {
    const text = optionText(opt);

    return MAIN_MEAL_PROTEINS.some(protein => {
      const normalizedProtein = normalizeText(protein);

      // Whey e achocolatado nunca podem contar como proteína de almoço/jantar.
      if (normalizedProtein.includes('whey') || normalizedProtein.includes('achocolatado')) {
        return false;
      }

      return text.includes(normalizedProtein);
    });
  };

  const isDuplicateOption = (option: any, existing: any[]) => {
    const text = optionText(option);

    return existing.some(old => optionText(old) === text);
  };

  const getFallbackOptions = (mealKey: string) => {
    if (mealKey === 'jantar') {
      return [
        {
          name: 'Frango com mandioca e salada',
          qty: 'Peito de Frango grelhado 150g + Mandioca cozida 150g + Salada verde à vontade',
          cal: 485,
          badge: 'Recomendada',
          badgeDesc: '',
          score: 1000,
        },
        {
          name: 'Peixe com batata e legumes',
          qty: 'Tilápia grelhada 160g + Batata inglesa cozida 200g + Legumes variados 150g',
          cal: 420,
          badge: 'Completa',
          badgeDesc: '',
          score: 900,
        },
        {
          name: 'Patinho com arroz e legumes',
          qty: 'Patinho moído 140g + Arroz branco cozido 120g + Legumes variados 150g',
          cal: 520,
          badge: 'Completa',
          badgeDesc: '',
          score: 850,
        },
      ];
    }

    return [
      {
        name: 'Arroz, feijão preto e frango',
        qty: 'Arroz branco cozido 150g + Feijão preto cozido 100g + Peito de Frango grelhado 150g + Salada verde à vontade',
        cal: 555,
        badge: 'Recomendada',
        badgeDesc: '',
        score: 1000,
      },
      {
        name: 'Arroz, feijão e carne moída',
        qty: 'Arroz branco cozido 150g + Feijão preto cozido 100g + Patinho moído 140g + Salada verde à vontade',
        cal: 610,
        badge: 'Completa',
        badgeDesc: '',
        score: 900,
      },
      {
        name: 'Peixe com batata e legumes',
        qty: 'Tilápia grelhada 160g + Batata inglesa cozida 220g + Legumes variados 150g',
        cal: 450,
        badge: 'Completa',
        badgeDesc: '',
        score: 850,
      },
    ];
  };

  const ensureOneRecommended = (options: any[]) => {
    if (!options.length) return options;

    const sorted = [...options].sort((a, b) => (b.score || 0) - (a.score || 0));

    return sorted.map((option, index) => ({
      ...option,
      badge: index === 0 ? 'Recomendada' : option.badge === 'Recomendada' ? 'Completa' : option.badge || 'Completa',
    }));
  };

  const validatedPlan: Record<string, any[]> = {};

  Object.keys(plan).forEach(mealKey => {
    const options = plan[mealKey] || [];
    const cleanedOptions: any[] = [];

    for (const opt of options) {
      if (!opt) continue;

      // Remove opção duplicada.
      if (isDuplicateOption(opt, cleanedOptions)) continue;

      if (isMainMealKey(mealKey)) {
        // Almoço/jantar não podem ter whey/achocolatado.
        if (hasSupplementInMainMeal(opt)) continue;

        // Não aceitar remendo genérico.
        if (hasGenericProteinPatch(opt)) continue;

        // Almoço/jantar precisam ter proteína real.
        if (!hasRealMainProtein(opt)) continue;
      }

      cleanedOptions.push({
  ...opt,
  qty: orderMealQtyText(
    sanitizeOptionQtyText(opt.qty || ''),
    mealKey
  ),
});
    }

    let finalOptions = cleanedOptions;

    // Se almoço/jantar ficou com poucas opções, completar com opções reais.
    if (isMainMealKey(mealKey) && finalOptions.length < 3) {
      const fallbacks = getFallbackOptions(mealKey);

      for (const fallback of fallbacks) {
        if (finalOptions.length >= 3) break;
        if (!isDuplicateOption(fallback, finalOptions)) {
          finalOptions.push(fallback);
        }
      }
    }

    // Nunca deixar refeição vazia.
    if (finalOptions.length === 0) {
      finalOptions = [
        {
          name: 'Pão integral com queijo minas',
          qty: 'Pão integral 2 fatias + Queijo minas frescal 1 fatia',
          cal: 280,
          badge: 'Recomendada',
          badgeDesc: '',
          score: 500,
        },
      ];
    }
    const sanitizedOptions = finalOptions.map(option => ({
  ...option,
  qty: orderMealQtyText(
    sanitizeOptionQtyText(option.qty || ''),
    mealKey
  ),
}));

const uniqueOptions = removeDuplicateMealOptions(sanitizedOptions);

validatedPlan[mealKey] = applySmartBadges(mealKey, uniqueOptions).slice(0, 3);
  });

  return validatedPlan;
};

const swapMealItem = (mealKey: string, index: number) => {
  if (!userProfile) return;

  const normalizeSwap = (value: string = '') =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const swapBank: Record<string, any[]> = {
    cafe: [
      {
        name: 'Tapioca com banana e canela',
        qty: 'Tapioca (goma) 50g + Banana prata 1 unidade + Canela em pó 1 colher de chá',
        cal: 335,
        badge: 'Completa',
        badgeDesc: '',
        score: 900,
      },
      {
        name: 'Cuscuz com banana e chia',
        qty: 'Cuscuz de milho 120g + Banana prata 1 unidade + Chia 1 colher de sopa',
        cal: 310,
        badge: 'Completa',
        badgeDesc: '',
        score: 880,
      },
      {
        name: 'Pão árabe com homus e tomate',
        qty: 'Pão árabe 1 unidade + Homus 1 colher de sopa + Tomate 80g',
        cal: 330,
        badge: 'Completa',
        badgeDesc: '',
        score: 860,
      },
      {
        name: 'Fruta com chia e bebida de amêndoas',
        qty: 'Maçã 1 unidade + Chia 1 colher de sopa + Bebida de amêndoas 1 copo',
        cal: 180,
        badge: 'Leve',
        badgeDesc: '',
        score: 840,
      },
      {
        name: 'Iogurte com banana e aveia',
        qty: 'Iogurte natural 1 pote + Banana prata 1 unidade + Aveia em flocos 20g',
        cal: 300,
        badge: 'Completa',
        badgeDesc: '',
        score: 820,
      },
      {
        name: 'Pão integral com ovos',
        qty: 'Pão integral 2 fatias + Ovo de galinha 2 unidades',
        cal: 330,
        badge: 'Completa',
        badgeDesc: '',
        score: 800,
      },
    ],

    almoco: [
      {
        name: 'Arroz, feijão e frango',
        qty: 'Arroz branco cozido 140g + Feijão preto cozido 100g + Peito de Frango grelhado 150g + Salada verde à vontade',
        cal: 555,
        badge: 'Completa',
        badgeDesc: '',
        score: 900,
      },
      {
        name: 'Peixe com batata e legumes',
        qty: 'Tilápia grelhada 160g + Batata inglesa cozida 220g + Legumes variados 180g',
        cal: 450,
        badge: 'Completa',
        badgeDesc: '',
        score: 880,
      },
      {
        name: 'Patinho com arroz e legumes',
        qty: 'Patinho moído 140g + Arroz branco cozido 120g + Legumes variados 180g',
        cal: 520,
        badge: 'Completa',
        badgeDesc: '',
        score: 860,
      },
      {
        name: 'Arroz, feijão e tofu grelhado',
        qty: 'Arroz integral cozido 130g + Feijão preto cozido 100g + Tofu grelhado 180g + Salada verde à vontade',
        cal: 500,
        badge: 'Completa',
        badgeDesc: '',
        score: 840,
      },
      {
        name: 'Batata com lentilha e salada',
        qty: 'Batata inglesa cozida 250g + Lentilha cozida 160g + Salada verde à vontade',
        cal: 420,
        badge: 'Completa',
        badgeDesc: '',
        score: 820,
      },
      {
        name: 'Cuscuz com grão-de-bico e legumes',
        qty: 'Cuscuz de milho cozido 150g + Grão-de-bico cozido 140g + Legumes variados 180g',
        cal: 465,
        badge: 'Completa',
        badgeDesc: '',
        score: 800,
      },
    ],

    jantar: [
      {
        name: 'Inhame, carne magra e legumes',
        qty: 'Inhame cozido 180g + Carne magra grelhada 140g + Legumes variados 180g',
        cal: 520,
        badge: 'Completa',
        badgeDesc: '',
        score: 900,
      },
      {
        name: 'Frango com mandioca e salada',
        qty: 'Peito de Frango grelhado 150g + Mandioca cozida 150g + Salada verde à vontade',
        cal: 485,
        badge: 'Completa',
        badgeDesc: '',
        score: 880,
      },
      {
        name: 'Peixe com batata e legumes',
        qty: 'Tilápia grelhada 160g + Batata inglesa cozida 200g + Legumes variados 180g',
        cal: 420,
        badge: 'Leve',
        badgeDesc: '',
        score: 860,
      },
      {
        name: 'Arroz, feijão e tofu grelhado',
        qty: 'Arroz integral cozido 130g + Feijão preto cozido 100g + Tofu grelhado 180g + Salada verde à vontade',
        cal: 500,
        badge: 'Completa',
        badgeDesc: '',
        score: 840,
      },
      {
        name: 'Cuscuz com grão-de-bico e legumes',
        qty: 'Cuscuz de milho cozido 150g + Grão-de-bico cozido 140g + Legumes variados 180g',
        cal: 465,
        badge: 'Completa',
        badgeDesc: '',
        score: 820,
      },
      {
        name: 'Batata com lentilha e salada',
        qty: 'Batata inglesa cozida 250g + Lentilha cozida 160g + Salada verde à vontade',
        cal: 420,
        badge: 'Completa',
        badgeDesc: '',
        score: 800,
      },
    ],

    lanche: [
      {
        name: 'Pipoca com fruta',
        qty: 'Pipoca (milho p/ estourar) 30g + Maçã 1 unidade',
        cal: 240,
        badge: 'Simples',
        badgeDesc: '',
        score: 900,
      },
      {
        name: 'Tapioca com banana e canela',
        qty: 'Tapioca (goma) 40g + Banana prata 1 unidade + Canela em pó 1 colher de chá',
        cal: 285,
        badge: 'Completa',
        badgeDesc: '',
        score: 880,
      },
      {
        name: 'Pão árabe com homus',
        qty: 'Pão árabe 1 unidade + Homus 1 colher de sopa',
        cal: 285,
        badge: 'Completa',
        badgeDesc: '',
        score: 860,
      },
      {
        name: 'Fruta com chia',
        qty: 'Maçã 1 unidade + Chia 1 colher de sopa',
        cal: 125,
        badge: 'Leve',
        badgeDesc: '',
        score: 840,
      },
      {
        name: 'Sanduíche natural de atum',
        qty: 'Pão integral 2 fatias + Atum em lata (água) 1 lata + Requeijão light 20g',
        cal: 360,
        badge: 'Completa',
        badgeDesc: '',
        score: 820,
      },
      {
        name: 'Iogurte com fruta e aveia',
        qty: 'Iogurte natural 1 pote + Banana prata 1 unidade + Aveia em flocos 20g',
        cal: 280,
        badge: 'Completa',
        badgeDesc: '',
        score: 800,
      },
    ],

    lancheManha: [
      {
        name: 'Fruta com chia',
        qty: 'Maçã 1 unidade + Chia 1 colher de sopa',
        cal: 125,
        badge: 'Leve',
        badgeDesc: '',
        score: 900,
      },
      {
        name: 'Banana com aveia',
        qty: 'Banana prata 1 unidade + Aveia em flocos 20g',
        cal: 155,
        badge: 'Simples',
        badgeDesc: '',
        score: 880,
      },
      {
        name: 'Pipoca simples',
        qty: 'Pipoca (milho p/ estourar) 25g',
        cal: 90,
        badge: 'Leve',
        badgeDesc: '',
        score: 860,
      },
      {
        name: 'Cuscuz com banana',
        qty: 'Cuscuz de milho 100g + Banana prata 1 unidade',
        cal: 190,
        badge: 'Simples',
        badgeDesc: '',
        score: 840,
      },
    ],

    ceia: [
      {
        name: 'Chá com fruta',
        qty: 'Chá sem açúcar 1 xícara + Maçã 1 unidade',
        cal: 70,
        badge: 'Leve',
        badgeDesc: '',
        score: 900,
      },
      {
        name: 'Banana com canela',
        qty: 'Banana prata 1 unidade + Canela em pó 1 colher de chá',
        cal: 85,
        badge: 'Leve',
        badgeDesc: '',
        score: 880,
      },
      {
        name: 'Morango com chia',
        qty: 'Morango 150g + Chia 1 colher de sopa',
        cal: 105,
        badge: 'Leve',
        badgeDesc: '',
        score: 860,
      },
      {
        name: 'Leite com canela',
        qty: 'Leite desnatado 1 copo + Canela em pó 1 colher de chá',
        cal: 75,
        badge: 'Leve',
        badgeDesc: '',
        score: 840,
      },
    ],
  };

  const optionSignature = (option: any) =>
    normalizeSwap(`${option?.name || ''} ${option?.qty || ''}`);

  setMealPlan(prev => {
    const currentOptions = prev[mealKey] || [];

    if (!currentOptions[index]) {
      console.warn('Trocar opção: opção não encontrada', { mealKey, index });
      return prev;
    }

    const current = currentOptions[index];
    const currentSignature = optionSignature(current);

    const usedByOtherCards = new Set(
      currentOptions
        .filter((_, optionIndex) => optionIndex !== index)
        .map(optionSignature)
    );

    const bank = swapBank[mealKey] || swapBank.lanche;

    const allowedBank = bank.filter(option => {
      const text = `${option.name || ''} ${option.qty || ''}`;
      return !isFoodRestricted(text, userProfile);
    });

    const sourceBank = allowedBank.length > 0 ? allowedBank : bank;

    let replacement =
      sourceBank.find(option => {
        const signature = optionSignature(option);

        return signature !== currentSignature && !usedByOtherCards.has(signature);
      }) ||
      sourceBank.find(option => optionSignature(option) !== currentSignature) ||
      sourceBank[0];

    if (!replacement) {
      console.warn('Trocar opção: nenhuma substituição encontrada', { mealKey, index });
      return prev;
    }

    const nextOptions = currentOptions.map((option, optionIndex) => {
      if (optionIndex !== index) return option;

      return {
        ...replacement,
        badge:
          option.badge === 'Recomendada'
            ? 'Recomendada'
            : replacement.badge || 'Completa',
        swappedAt: Date.now(),
      };
    });

    return {
      ...prev,
      [mealKey]: nextOptions,
    };
  });
};
const addRecipeToPlan = (recipe: any, mealKey: string) => {
  if (!userProfile) return;

  const recipeText = [
    recipe.title,
    recipe.friendlyTitle,
    recipe.description,
    ...(recipe.ingredients || []),
    ...(recipe.tags || []),
  ].join(' ');

  if (isFoodRestricted(recipeText, userProfile)) {
    alert('Essa receita não combina com suas restrições atuais.');
    return;
  }

  const recipeOption: any = {
    name: recipe.friendlyTitle || recipe.title,
    qty: (recipe.ingredients || []).join(' + '),
    cal: recipe.cal,
    p: recipe.p,
    c: recipe.c,
    f: recipe.f,
    badge: 'Receita',
    badgeDesc: recipe.title,
    fromRecipe: true,
    recipeId: recipe.id,
    swappedAt: Date.now(),
  };

  setMealPlan(prev => {
    const currentOptions = prev[mealKey] || [];

    const withoutSameRecipe = currentOptions.filter((option: any) => {
      const sameRecipeId = option.recipeId && option.recipeId === recipe.id;
      const sameName =
        normalizePlanText(option.name || '') === normalizePlanText(recipeOption.name || '');

      return !sameRecipeId && !sameName;
    });

    return {
      ...prev,
      [mealKey]: [recipeOption, ...withoutSameRecipe].slice(0, 3),
    };
  });
};
  const completeScreening = (profile: UserProfile) => {
    setUserProfile(profile);
    const count = profile.mealCount;
    setMealCount(count);
    
    // Recalculate Goals
    const weight = safeNumber(profile.weight, 70);
    const height = safeNumber(profile.height, 170);
    const age = safeNumber(profile.age, 25);
    let bmr = 10 * weight + 6.25 * height - 5 * age + (profile.gender === 'masculino' ? 5 : -161);
    const activityMult = 1.2 + (profile.trainingsPerWeek * 0.05); 
    let tdee = bmr * activityMult;
    let calorieGoalLocal = profile.goal === 'perda' ? Math.round(tdee * 0.8) : profile.goal === 'ganho' ? Math.round(tdee * 1.15) : Math.round(tdee);
    calorieGoalLocal = safeNumber(calorieGoalLocal, 1800);

    const initialNewPlan: Record<string, { name: string; qty: string; cal: number; badge?: string; badgeDesc?: string }[]> = {};
    const configs = MEAL_CONFIGS[count];

    configs.forEach(cfg => {
      let baseTarget = 0;
      if (count === 3) {
        if (cfg.key === 'cafe') baseTarget = calorieGoalLocal * 0.25;
        else if (cfg.key === 'almoco') baseTarget = calorieGoalLocal * 0.40;
        else if (cfg.key === 'jantar') baseTarget = calorieGoalLocal * 0.35;
      } else if (count === 4) {
        if (cfg.key === 'cafe') baseTarget = calorieGoalLocal * 0.25;
        else if (cfg.key === 'almoco') baseTarget = calorieGoalLocal * 0.35;
        else if (cfg.key === 'lanche') baseTarget = calorieGoalLocal * 0.15;
        else if (cfg.key === 'jantar') baseTarget = calorieGoalLocal * 0.25;
      } else if (count === 5) {
        if (cfg.key === 'cafe') baseTarget = calorieGoalLocal * 0.20;
        else if (cfg.key === 'lancheManha') baseTarget = calorieGoalLocal * 0.10;
        else if (cfg.key === 'almoco') baseTarget = calorieGoalLocal * 0.35;
        else if (cfg.key === 'lanche') baseTarget = calorieGoalLocal * 0.15;
        else if (cfg.key === 'jantar') baseTarget = calorieGoalLocal * 0.20;
      } else if (count === 6) {
        if (cfg.key === 'cafe') baseTarget = calorieGoalLocal * 0.18;
        else if (cfg.key === 'lancheManha') baseTarget = calorieGoalLocal * 0.10;
        else if (cfg.key === 'almoco') baseTarget = calorieGoalLocal * 0.30;
        else if (cfg.key === 'lanche') baseTarget = calorieGoalLocal * 0.12;
        else if (cfg.key === 'jantar') baseTarget = calorieGoalLocal * 0.22;
        else if (cfg.key === 'ceia') baseTarget = calorieGoalLocal * 0.08;
      }
      initialNewPlan[cfg.key] = getMealOptions(baseTarget, profile, cfg.key);
    });

    setMealPlan(initialNewPlan);
    setMeals([]); 
    setOnboarded(true);
  };

  const resetApp = () => {
    setIsLoggedIn(false);
    setOnboarded(false);
    setUserProfile(null);
    setHistory({});
    setMealCount(4);
    setCustomFoods([]);
    setPendingMealType(null);
    setPendingEditMealId(null);
    setMyCheckin('Estou bem');
  };

  const fillDemo = () => {
    const demoProfile: UserProfile = {
      name: 'Thiago Barbosa', 
      age: 28, 
      weight: 78.5, 
      height: 174, 
      gender: 'masculino',
      goal: 'perda', 
      trainingsPerWeek: 4,
      mealCount: 4,
      mainDifficulty: 'Vontade de Doces',
      restrictions: [],
      preferredIngredients: {
        breakfast: ['Pão integral', 'Ovo de galinha'],
        main: ['Peito de Frango grelhado', 'Arroz integral cozido', 'Feijão carioca cozido'],
        snacks: ['Iogurte natural', 'Banana prata', 'Pipoca']
      }
    };
    setUserProfile(demoProfile);
    setMealCount(4);
    setMeals(INIT_MEALS);
    setOnboarded(true);
    setIsLoggedIn(true);
  };
  
useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('e2eDemo') === '1') {
    fillDemo();
  }
}, []);

  return (
    <Ctx.Provider value={{
      meals, customFoods, workouts, mealCount, pendingMealType, pendingEditMealId, myCheckin,
      calorieGoal, macros, userProfile, isLoggedIn, onboarded, addMeal, updateMeal, deleteMeal, 
      addCustomFood, setWorkouts, addWorkout, deleteWorkout, setMealCount, setPendingMealType, setPendingEditMealId, setMyCheckin, 
      getTotals, estimateBurned, login, signup, logout, updateProfile, handleProfileUpdate, completeScreening, resetApp, fillDemo,
      mealPlan,
      generateNewPlan,
      swapMealItem,
      addRecipeToPlan,
      selectedCircleId,
      setSelectedCircleId,
      selectedDate,
      setSelectedDate,
      setMeals,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────


// ─── REFEICAO SEARCH MODAL ────────────────────────────────────────────────────

function AddFoodModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (entry: MealEntry) => void }) {
  const { addCustomFood, userProfile } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Todas');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState('100');
  const [unit, setUnit] = useState<'g' | 'un'>('g');
  const [showCreateFood, setShowCreateFood] = useState(false);
  const [fuzzySuggestion, setFuzzySuggestion] = useState<{ match: string; suggestion: string } | null>(null);

  const [newName, setNewName] = useState('');
  const [newCal, setNewCal] = useState('');
  const [newP, setNewP] = useState('');
  const [newC, setNewC] = useState('');
  const [newF, setNewF] = useState('');
  const [newCat, setNewCat] = useState('Geral');

  const filtered = FOODS.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'Todas' || f.category === selectedCat;
    
    if (isFoodRestricted(f.name, userProfile)) return false;

    return matchesSearch && matchesCat;
  });

  useEffect(() => {
    if (search.length > 3) {
      const matchName = findFuzzyMatch(search);
      if (matchName && matchName.toLowerCase() !== search.toLowerCase()) {
        const fuzzy = ALIASES_FUZZY[search.toLowerCase()] || { match: matchName, suggestion: matchName };
        setFuzzySuggestion(fuzzy);
      } else {
        setFuzzySuggestion(null);
      }
    } else {
      setFuzzySuggestion(null);
    }
  }, [search]);

  useEffect(() => {
    if (selectedFood) {
      if (selectedFood.un) {
        setUnit('un');
        setQty('1');
      } else {
        setUnit('g');
        setQty('100');
      }
    }
  }, [selectedFood]);

  const handleAdd = () => {
    if (!selectedFood) return;
    const qv = parseFloat(qty) || 0;
    if (qv <= 0) return;
    
    let grams = qv;
    if (unit === 'un' && selectedFood.amountPerUn) {
      grams = qv * selectedFood.amountPerUn;
    }
    
    const factor = grams / 100;
    onAdd({
      food: selectedFood,
      qty: qv,
      unit,
      cal: Math.round(selectedFood.cal * factor),
      p: Number((selectedFood.p * factor).toFixed(1)),
      c: Number((selectedFood.c * factor).toFixed(1)),
      f: Number((selectedFood.f * factor).toFixed(1)),
    });
    setSelectedFood(null);
    setSearch('');
  };

  const handleCreateFood = () => {
    if (!newName || !newCal) return;
    const food: FoodItem = {
      name: newName,
      category: newCat,
      cal: parseFloat(newCal) || 0,
      p: parseFloat(newP) || 0,
      c: parseFloat(newC) || 0,
      f: parseFloat(newF) || 0,
    };
    addCustomFood(food);
    FOODS.unshift(food); 
    setShowCreateFood(false);
    setSelectedFood(food);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col"
          >
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-900">{showCreateFood ? 'Novo Alimento' : 'Adicionar Alimento'}</h3>
                {!showCreateFood && <p className="text-[10px] font-bold text-gray-400 mt-0.5">{FOODS.length} alimentos disponíveis</p>}
              </div>
              <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-2xl transition-colors bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
              {showCreateFood ? (
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome do Alimento</label>
                      <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500 text-sm font-bold" placeholder="Ex: Crepioca" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Calorias (por 100g)</label>
                        <input value={newCal} onChange={e => setNewCal(e.target.value)} keyboardType="numeric" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500 text-sm font-bold" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Proteína</label>
                        <input value={newP} onChange={e => setNewP(e.target.value)} keyboardType="numeric" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500 text-sm font-bold" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Carbos</label>
                        <input value={newC} onChange={e => setNewC(e.target.value)} keyboardType="numeric" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500 text-sm font-bold" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Gorduras</label>
                        <input value={newF} onChange={e => setNewF(e.target.value)} keyboardType="numeric" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500 text-sm font-bold" placeholder="0" />
                      </div>
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button onClick={() => setShowCreateFood(false)} className="flex-1 py-4 font-black text-gray-400 bg-gray-50 rounded-3xl uppercase text-xs">Cancelar</button>
                      <button onClick={handleCreateFood} className="flex-[2] py-4 font-black text-white bg-green-500 rounded-3xl shadow-xl shadow-green-100 uppercase text-xs">Salvar e Usar</button>
                   </div>
                </div>
              ) : !selectedFood ? (
                <>
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 font-medium placeholder:text-gray-400 shadow-inner" 
                      placeholder="Buscar arroz, frango, banana..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>

                  {fuzzySuggestion && (
                    <div className="mb-6 mx-2 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between">
                       <p className="text-xs font-bold text-orange-800">Você quis dizer <span className="underline italic text-orange-900">{fuzzySuggestion.suggestion}</span>?</p>
                       <div className="flex gap-2">
                          <button onClick={() => {
                            setSearch(fuzzySuggestion.match);
                            setFuzzySuggestion(null);
                          }} className="px-3 py-1 bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase">Sim</button>
                          <button onClick={() => setFuzzySuggestion(null)} className="px-3 py-1 bg-white text-orange-400 rounded-lg text-[9px] font-black uppercase border border-orange-100">Não</button>
                       </div>
                    </div>
                  )}
                  
                  {filtered.length === 0 && search.length > 0 && !fuzzySuggestion && (
                    <div className="mb-6 p-6 bg-gray-50 rounded-[32px] text-center border-2 border-dashed border-gray-100">
                      <p className="text-sm font-bold text-gray-400 mb-4 leading-relaxed">Alimento não encontrado. Deseja adicionar manualmente?</p>
                      <button onClick={() => {
                        setNewName(search);
                        setShowCreateFood(true);
                      }} className="px-6 py-3 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-green-100">Adicionar manualmente</button>
                    </div>
                  )}
                  
                  <div className="flex overflow-x-auto gap-2 pb-4 mb-4 no-scrollbar">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCat(cat)}
                        className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                          selectedCat === cat ? 'bg-green-500 text-white border-green-500 shadow-md translate-y-[-2px]' : 'bg-gray-50 text-gray-400 border-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {!search && (
                      <button 
                        onClick={() => setShowCreateFood(true)}
                        className="w-full flex items-center justify-between p-5 bg-green-50 border border-green-100 border-dashed rounded-3xl hover:bg-green-100 transition-all text-left mb-2"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                               <PlusCircle size={18} className="text-green-500" />
                            </div>
                            <div>
                               <p className="font-black text-green-700 text-sm">Novo personalizado</p>
                               <p className="text-[10px] font-bold text-green-600/70 uppercase">Crie seu próprio alimento</p>
                            </div>
                         </div>
                         <ChevronRight size={16} className="text-green-400" />
                      </button>
                    )}
                    {filtered.map(food => (
                      <button 
                        key={food.name}
                        onClick={() => setSelectedFood(food)}
                        className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl hover:border-green-300 hover:shadow-lg transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                              <LayoutGrid size={18} className="text-gray-300 group-hover:text-green-500" />
                           </div>
                           <div>
                             <p className="font-black text-gray-900 text-sm">{food.name}</p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{food.category} · 100g</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-green-600">{food.cal} <span className="text-[9px] uppercase opacity-40">calorias</span></p>
                          <p className="text-[9px] font-bold text-gray-300 tracking-tighter">P:{food.p} C:{food.c} G:{food.f}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setShowCreateFood(true)}
                    className="w-full mt-8 py-5 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center gap-3 text-gray-400 font-black uppercase text-xs hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all mb-10"
                  >
                    <PlusCircle size={18} />
                    Criar Alimento Personalizado
                  </button>
                </>
              ) : (
                <div className="py-2">
                   <div className="bg-green-50 p-6 rounded-[32px] mb-8 relative border border-green-100 overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <Zap size={80}/>
                      </div>
                      <p className="text-green-800 font-black text-2xl mb-1">{selectedFood.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-green-500/10 rounded-full">
                          <p className="text-green-600 text-[10px] font-black uppercase tracking-widest">{selectedFood.category}</p>
                        </div>
                        <p className="text-green-600 text-[10px] font-bold opacity-60">Base: {selectedFood.cal} calorias / 100g {selectedFood.source && `(${selectedFood.source})`}</p>
                      </div>
                   </div>
                   {(selectedFood.recipe?.length || selectedFood.prep || selectedFood.portionNote) && (
  <div className="bg-amber-50 border border-amber-100 rounded-[28px] p-5 mb-8">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
        <Book size={16} />
      </div>

      <div>
        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
          Receita
        </p>
        <p className="text-[9px] font-bold text-amber-600/70 uppercase tracking-tight">
          Como preparar essa opção
        </p>
      </div>
    </div>

    {selectedFood.recipe?.length && (
      <div className="mb-4">
        <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-2">
          Você vai usar
        </p>

        <div className="flex flex-wrap gap-2">
          {selectedFood.recipe.map((item) => (
            <span
              key={item}
              className="bg-white text-amber-700 border border-amber-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    )}

    {selectedFood.prep && (
      <div className="mb-4">
        <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">
          Preparo
        </p>

        <p className="text-xs font-bold text-amber-900/80 leading-relaxed">
          {selectedFood.prep}
        </p>
      </div>
    )}

    {selectedFood.portionNote && (
      <div className="bg-white/70 border border-amber-100 rounded-2xl px-4 py-3">
        <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">
          Porção sugerida
        </p>

        <p className="text-xs font-bold text-amber-900/80">
          {selectedFood.portionNote}
        </p>
      </div>
    )}
  </div>
)}
                   
                   <div className="flex bg-gray-100 p-1.5 rounded-3xl mb-8">
                      <button 
                         onClick={() => setUnit('g')}
                         className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${unit === 'g' ? 'bg-white text-green-600 shadow-md' : 'text-gray-400'}`}
                      >Gramas (g)</button>
                      {selectedFood.un && (
                        <button 
                          onClick={() => setUnit('un')}
                          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${unit === 'un' ? 'bg-white text-green-600 shadow-md' : 'text-gray-400'}`}
                        >{selectedFood.un}</button>
                      )}
                   </div>

                   <div className="flex flex-col items-center mb-10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        Quantidade em {unit === 'un' ? selectedFood.un : 'gramas'}
                      </p>
                      <div className="flex items-center gap-8">
                        <button onClick={() => setQty(p => String(Math.max(0, (parseFloat(p) || 0) - (unit === 'un' ? 1 : 10))))} className="p-5 bg-gray-50 rounded-3xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><Minus size={24}/></button>
                        <div className="flex flex-col items-center">
                          <input 
                            className="w-40 text-center text-6xl font-black text-gray-900 focus:outline-none bg-transparent"
                            value={qty}
                            onChange={e => setQty(e.target.value)}
                            onBlur={() => { if (!qty) setQty(unit === 'un' ? '1' : '100'); }}
                            autoFocus
                          />
                          <div className="h-1 w-20 bg-green-500 rounded-full mt-2"/>
                        </div>
                        <button onClick={() => setQty(p => String((parseFloat(p) || 0) + (unit === 'un' ? 1 : 10)))} className="p-5 bg-gray-50 rounded-3xl text-gray-400 hover:bg-green-50 hover:text-green-500 transition-all"><Plus size={24}/></button>
                      </div>
                   </div>

                   <div className="grid grid-cols-4 gap-3 mb-10">
                      {[
                        { l: 'Calorias', v: Math.round(selectedFood.cal * (((unit === 'un' && selectedFood.amountPerUn) ? (parseFloat(qty) || 0) * selectedFood.amountPerUn : (parseFloat(qty) || 0)) / 100)), c: 'bg-gray-50 text-gray-900 border-gray-100' },
                        { l: 'Proteína', v: (selectedFood.p * (((unit === 'un' && selectedFood.amountPerUn) ? (parseFloat(qty) || 0) * selectedFood.amountPerUn : (parseFloat(qty) || 0)) / 100)).toFixed(1) + 'g', c: 'bg-blue-50 text-blue-600 border-blue-100' },
                        { l: 'Carbos', v: (selectedFood.c * (((unit === 'un' && selectedFood.amountPerUn) ? (parseFloat(qty) || 0) * selectedFood.amountPerUn : (parseFloat(qty) || 0)) / 100)).toFixed(1) + 'g', c: 'bg-green-50 text-green-600 border-green-100' },
                        { l: 'Gorduras', v: (selectedFood.f * (((unit === 'un' && selectedFood.amountPerUn) ? (parseFloat(qty) || 0) * selectedFood.amountPerUn : (parseFloat(qty) || 0)) / 100)).toFixed(1) + 'g', c: 'bg-orange-50 text-orange-600 border-orange-100' },
                      ].map(m => (
                        <div key={m.l} className={`${m.c} p-4 rounded-[22px] text-center border shadow-sm`}>
                          <p className="text-[9px] font-black uppercase opacity-60 mb-2 tracking-tighter">{m.l}</p>
                          <p className="font-black text-sm">{m.v}</p>
                        </div>
                      ))}
                   </div>

                   <div className="flex gap-4">
                     <button onClick={() => setSelectedFood(null)} className="flex-1 py-5 bg-gray-50 text-gray-400 font-black rounded-3xl uppercase text-xs">Voltar</button>
                     <button onClick={handleAdd} className="flex-[2] py-5 bg-green-500 text-white font-black rounded-3xl shadow-xl shadow-green-100 uppercase text-xs tracking-widest active:scale-95 transition-all">Adicionar à Refeição</button>
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── MAIN SCREENS ─────────────────────────────────────────────────────────────

function CalorieRing({
  consumed,
  goal,
  size = 200,
  burned = 0,
}: {
  consumed: number;
  goal: number;
  size?: number;
  burned?: number;
}) {
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;

  const safeConsumed = Math.max(0, Math.round(safeNumber(consumed)));
  const safeGoal = Math.max(1, Math.round(safeNumber(goal, 1)));

  const progress = Math.min(safeConsumed / safeGoal, 1);
  const isOver = safeConsumed > safeGoal;

  const strokeDashoffset = circumference - progress * circumference;
  const ringColor = isOver ? '#F59E0B' : '#FFFFFF';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={stroke}
            fill="transparent"
          />

          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
            Consumido
          </p>

          <p className="mt-1 text-5xl font-black leading-none text-white">
            {safeConsumed}
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-widest text-white/65">
            cal
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] font-bold text-white/60">
        Meta diária: {safeGoal} calorias
      </p>

      <span className="sr-only">
        Treino registrado: {Math.round(safeNumber(burned))} calorias
      </span>
    </div>
  );
}

// ─── ONBOARDING SCREENS ────────────────────────────────────────────────────────
function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="z-10 flex flex-col items-center text-center">
        <Logo light />
        <p className="text-lg font-medium opacity-80 max-w-[280px] leading-relaxed mt-4">Seu plano alimentar com o apoio do seu círculo</p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.5 }}
        className="absolute bottom-12 w-full px-8"
      >
        <button 
          onClick={onNext}
          className="w-full bg-white text-green-600 font-black py-5 rounded-[32px] text-lg shadow-2xl active:scale-95 transition-all"
        >
          Começar Jornada
        </button>
      </motion.div>
    </div>
  );
}

function AuthScreen({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const { login, signup } = useApp();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorFields, setErrorFields] = useState<string[]>([]);

  const validate = () => {
    const fields: string[] = [];
    let msg = '';

    if (mode === 'login') {
      if (!email.trim()) {
        fields.push('email');
        msg = 'Preencha seu e-mail para continuar.';
      } else if (!email.includes('@')) {
        fields.push('email');
        msg = 'Digite um e-mail válido.';
      } else if (!password.trim()) {
        fields.push('password');
        msg = 'Digite sua senha.';
      }
    } else {
      if (!name.trim()) {
        fields.push('name');
        msg = 'Digite seu nome.';
      } else if (!email.trim()) {
         fields.push('email');
         msg = 'Digite seu e-mail.';
      } else if (!email.includes('@')) {
         fields.push('email');
         msg = 'Digite um e-mail válido.';
      } else if (!password.trim()) {
         fields.push('password');
         msg = 'Digite uma senha.';
      } else if (password.length < 6) {
         fields.push('password');
         msg = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (!confirmPassword.trim()) {
         fields.push('confirmPassword');
         msg = 'Confirme sua senha.';
      } else if (password !== confirmPassword) {
         fields.push('password', 'confirmPassword');
         msg = 'As senhas não conferem.';
      }
    }

    setErrorFields(fields);
    setError(msg);
    return fields.length === 0;
  };

  const handleAction = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    // Simulate a short delay for premium feel
    await new Promise(res => setTimeout(res, 800));

    if (mode === 'login') {
      login(email);
      onLogin();
    } else {
      signup(email);
      onSignup();
    }
    setIsLoading(false);
  };

  const handleDemo = async () => {
    setIsLoading(true);
    await new Promise(res => setTimeout(res, 500));
    login('demo@test.com'); 
    onLogin();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col relative">
       {mode === 'signup' && (
         <button 
           onClick={() => setMode('login')}
           className="absolute top-8 left-8 p-3 bg-gray-50 rounded-2xl text-gray-400 active:scale-95 transition-all"
         >
           <ChevronUp className="-rotate-90" size={20} />
         </button>
       )}

       <div className="flex-1 flex flex-col justify-center">
          <div className={`mb-8 flex justify-center transition-all ${mode === 'signup' ? 'scale-75' : 'scale-100'}`}>
             <Logo />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight">
            {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-10">
            {mode === 'login' ? 'Entre para continuar seu progresso' : 'Comece sua jornada FitCircle hoje'}
          </p>

          <div className="space-y-4">
             {mode === 'signup' && (
               <div className="space-y-1">
                  <label className={`text-[10px] font-black uppercase ml-1 ${errorFields.includes('name') ? 'text-red-500' : 'text-gray-400'}`}>Nome</label>
                  <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-bold ${errorFields.includes('name') ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-green-500'}`} 
                    placeholder="Seu nome" 
                  />
               </div>
             )}
             <div className="space-y-1">
                <label className={`text-[10px] font-black uppercase ml-1 ${errorFields.includes('email') ? 'text-red-500' : 'text-gray-400'}`}>E-mail</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  placeholder="seu@email.com" 
                />
             </div>
             <div className="space-y-1">
                <label className={`text-[10px] font-black uppercase ml-1 ${errorFields.includes('password') ? 'text-red-500' : 'text-gray-400'}`}>Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                 className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  placeholder="••••••••" 
                />
             </div>
             {mode === 'signup' && (
               <div className="space-y-1">
                  <label className={`text-[10px] font-black uppercase ml-1 ${errorFields.includes('confirmPassword') ? 'text-red-500' : 'text-gray-400'}`}>Confirmar Senha</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-bold ${errorFields.includes('confirmPassword') ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-green-500'}`} 
                    placeholder="••••••••" 
                  />
               </div>
             )}

             {error && (
               <div className="flex items-center gap-2 px-2 py-1">
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-xs font-bold text-red-500">{error}</p>
               </div>
             )}
             <button
  type="button"
  className="self-end text-xs font-bold text-green-700 hover:text-green-800"
>
  Esqueci minha senha
</button>
             <button 
              onClick={handleAction}
              disabled={isLoading}
              className={`w-full bg-green-500 text-white font-black py-5 mt-6 rounded-[32px] shadow-xl shadow-green-100 uppercase tracking-widest text-sm active:scale-95 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-80' : ''}`}
             >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : (
                  <>{mode === 'login' ? 'Entrar' : 'Continuar'}</>
                )}
             </button>

             {mode === 'login' && (
               <>
                 <div className="flex items-center gap-4 py-6">
                    <div className="h-px bg-gray-100 flex-1"/>
                    <span className="text-[10px] font-black text-gray-300 uppercase">ou</span>
                    <div className="h-px bg-gray-100 flex-1"/>
                 </div>

                 <button 
                  onClick={handleDemo}
                  disabled={isLoading}
                  className="w-full bg-gray-50 text-gray-400 font-black py-5 rounded-[28px] text-[10px] uppercase tracking-widest border border-gray-100 active:bg-gray-100 transition-all mb-4 flex items-center justify-center gap-2"
                 >
                    {isLoading ? (
                       <span className="w-3 h-3 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                    ) : (
                       <span>Entrar como Demo</span>
                    )}
                 </button>
               </>
             )}
          </div>
       </div>
       <div className="text-center text-xs text-gray-400 font-medium pb-2">
         {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
         <button 
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-green-600 font-black ml-1 outline-none hover:underline"
         >
           {mode === 'login' ? 'Criar agora' : 'Entrar agora'}
         </button>
       </div>
    </div>
  );
}

const INGREDIENTS = {
  breakfast: [
    'Pão integral', 'Pão francês', 'Tapioca', 'Aveia', 'Cuscuz', 'Iogurte', 'Leite', 'Ovos', 
    'Queijo minas', 'Cottage', 'Banana', 'Maçã', 'Morango', 'Mamão', 'Mel'
  ],
  main: [
    'Arroz branco', 'Arroz integral', 'Feijão', 'Batata inglesa', 'Batata doce', 'Inhame', 'Mandioca', 
    'Macarrão', 'Frango', 'Patinho', 'Carne magra', 'Peixe', 'Atum', 'Salada', 'Legumes'
  ],
  snacks: [
    'Iogurte', 'Fruta', 'Aveia', 'Pão integral', 'Frango desfiado', 'Atum', 
    'Queijo', 'Pipoca', 'Crepioca', 'Castanhas'
  ]
};

function TriagemScreen({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const { userProfile } = useApp();
  const [step, setStep] = useState(1);
  const [screeningError, setScreeningError] = useState('');
  const totalSteps = 9;

  const [profile, setProfile] = useState<UserProfile>(userProfile || {
    name: '',
    age: 25,
    weight: 70,
    height: 170,
    gender: 'masculino',
    goal: 'perda',
    trainingsPerWeek: 3,
    mealCount: 4,
    dietaryProfile: 'sem_restricao',
    mainDifficulty: '',
    restrictions: [],
    preferredIngredients: { breakfast: [], main: [], snacks: [] },
  });

  const restrictionOptions = [
    'Lactose',
    'Glúten',
    'Amendoim',
    'Castanhas/nozes',
    'Ovo',
    'Leite',
    'Soja',
    'Peixes',
    'Crustáceos',
    'Frutos do Mar',
    'Gergelim',
    'Corantes/aditivos',
    'Outro',
  ];

  useEffect(() => {
    scrollToTop();
  }, [step]);

  const next = () => {
    setScreeningError('');

    if (step === 9 && (!profile.restrictions || profile.restrictions.length === 0)) {
      setScreeningError('Selecione uma restrição ou marque "Nenhuma" para continuar.');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }

    const finalProfile = {
      ...profile,
      restrictions: (profile.restrictions || []).filter(
        restriction => restriction !== 'Nenhuma'
      ),
    };

    onComplete(finalProfile);
  };

  const back = () => step > 1 && setStep(step - 1);

  const toggleRestriction = (res: string) => {
    setScreeningError('');

    let prev = [...(profile.restrictions || [])];

    if (res === 'Nenhuma') {
      prev = ['Nenhuma'];
    } else {
      prev = prev.filter(x => x !== 'Nenhuma');

      if (prev.includes(res)) {
        prev = prev.filter(x => x !== res);
      } else {
        prev.push(res);
      }
    }

    setProfile({ ...profile, restrictions: prev });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-bold text-green-600">
  Boas-vindas
</p>
              <h2 className="text-4xl font-black text-gray-900 leading-tight">
                Como podemos te chamar?
              </h2>
            </div>

            <input
              autoFocus
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              className="w-full rounded-[32px] border border-gray-200 bg-gray-50 p-6 text-2xl font-black text-gray-900 placeholder:text-gray-300 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
              placeholder="Seu nome"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Sua idade e sexo biológico
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4">
                  Idade
                </label>

                <input
                  type="number"
                  value={profile.age}
                  onChange={e => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-[32px] border border-gray-200 bg-gray-50 p-6 text-center text-xl font-black text-gray-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4">
                  Sexo
                </label>

                <div className="flex bg-gray-50 p-1.5 rounded-[32px]">
                  {['masculino', 'feminino'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setProfile({ ...profile, gender: g as any })}
                      className={`flex-1 py-4 rounded-[28px] text-[10px] font-black uppercase transition-all ${
                        profile.gender === g
                          ? 'bg-white text-green-600 shadow-sm'
                          : 'text-gray-500'
                      }`}
                    >
                      {g === 'masculino' ? 'Masc' : 'Fem'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Peso e Altura
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4">
                  Peso
                </label>

                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={profile.weight}
                    onChange={e => setProfile({ ...profile, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-[32px] border border-gray-200 bg-gray-50 p-6 pr-12 text-center text-xl font-black text-gray-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />

                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-gray-400">
                    kg
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4">
                  Altura
                </label>

                <div className="relative">
                  <input
                    type="number"
                    value={profile.height}
                    onChange={e => setProfile({ ...profile, height: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-[32px] border border-gray-200 bg-gray-50 p-6 pr-12 text-center text-xl font-black text-gray-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />

                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-gray-400">
                    cm
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Perfil Alimentar
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {[
                { k: 'sem_restricao', l: 'Sem restrição', d: 'Como de tudo' },
                { k: 'vegetariano', l: 'Vegetariano', d: 'Sem carne (frango, carne, peixe)' },
                { k: 'vegano', l: 'Vegano', d: 'Sem nenhum item de origem animal' },
                { k: 'pescetariano', l: 'Pescetariano', d: 'Sem carne, mas como peixe' },
              ].map(opt => {
                const selected = profile.dietaryProfile === opt.k || (!profile.dietaryProfile && opt.k === 'sem_restricao');

                return (
                  <button
                    key={opt.k}
                    type="button"
                    onClick={() => setProfile({ ...profile, dietaryProfile: opt.k as any })}
                    className={`p-6 rounded-[32px] border-2 text-left transition-all ${
                      selected
                        ? 'bg-green-50 border-green-500'
                        : 'bg-gray-50 border-transparent shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-900 text-lg">
                          {opt.l}
                        </p>

                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-1">
                          {opt.d}
                        </p>
                      </div>

                      {selected && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Qual seu foco hoje?
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {[
                { k: 'perda', l: 'Emagrecer', d: 'Focar em queima de gordura' },
                { k: 'manutencao', l: 'Manter Peso', d: 'Saúde e definição' },
                { k: 'ganho', l: 'Ganhar Massa', d: 'Foco em músculos e força' },
              ].map(opt => {
                const selected = profile.goal === opt.k;

                return (
                  <button
                    key={opt.k}
                    type="button"
                    onClick={() => setProfile({ ...profile, goal: opt.k as any })}
                    className={`p-6 rounded-[32px] border-2 text-left transition-all ${
                      selected
                        ? 'bg-green-50 border-green-500'
                        : 'bg-gray-50 border-transparent shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-900 text-lg">
                          {opt.l}
                        </p>

                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-1">
                          {opt.d}
                        </p>
                      </div>

                      {selected && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Frequência de treinos
            </h2>

            <div className="space-y-8 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Sessões por semana
              </p>

              <div className="flex justify-center text-9xl font-black text-green-500">
                {profile.trainingsPerWeek}
              </div>

              <input
                type="range"
                min="0"
                max="7"
                value={profile.trainingsPerWeek}
                onChange={e => setProfile({ ...profile, trainingsPerWeek: parseInt(e.target.value) })}
                className="w-full accent-green-500 h-2 bg-gray-100 rounded-full"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Refeições por dia
            </h2>

            <div className="grid grid-cols-2 gap-3 mt-8">
              {[3, 4, 5, 6].map(n => {
                const selected = profile.mealCount === n;

                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setProfile({ ...profile, mealCount: n as any })}
                    className={`p-8 rounded-[38px] border-2 flex flex-col items-center justify-center transition-all ${
                      selected
                        ? 'bg-green-50 border-green-500 text-green-600'
                        : 'bg-gray-50 border-transparent text-gray-600'
                    }`}
                  >
                    <span className="text-3xl font-black">
                      {n}
                    </span>

                    <span className="text-[10px] font-bold uppercase mt-1">
                      Refeições
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Sua maior dificuldade?
            </h2>

            <div className="grid grid-cols-1 gap-2">
              {[
                'Falta de Tempo',
                'Vontade de Doces',
                'Fome Excessiva',
                'Rotina Social',
                'Não saber cozinhar',
                'Organização das refeições',
              ].map(diff => {
                const selected = profile.mainDifficulty === diff;

                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setProfile({ ...profile, mainDifficulty: diff })}
                    className={`p-5 rounded-3xl border-2 text-left font-bold transition-all ${
                      selected
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-gray-50 border-transparent text-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{diff}</span>

                      {selected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-bold text-red-500">
  Segurança
</p>

              <h2 className="text-4xl font-black text-gray-900 leading-tight">
                Restrições ou Alergias?
              </h2>
            </div>

            <p className="text-xs text-gray-500 font-bold px-1 uppercase tracking-tight">
              Marque apenas o que você precisa evitar.
            </p>

            {screeningError && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <p className="text-xs font-black text-red-600 leading-relaxed">
                  {screeningError}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => toggleRestriction('Nenhuma')}
              className={`w-full rounded-[30px] border-2 p-5 text-left transition-all ${
                profile.restrictions.includes('Nenhuma')
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-100 bg-gray-50 text-gray-600'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black">
                    Nenhuma restrição
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-tight text-green-600">
                    Posso comer normalmente
                  </p>
                </div>

                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  profile.restrictions.includes('Nenhuma')
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-300'
                }`}>
                  <Check size={17} />
                </div>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              {restrictionOptions.map(res => {
                const selected = profile.restrictions.includes(res);

                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => toggleRestriction(res)}
                    className={`min-h-[56px] rounded-2xl border-2 px-3 py-4 text-center text-xs font-bold transition-all ${
                      selected
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-gray-50 border-transparent text-gray-600 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>{res}</span>

                      {selected && (
                        <Check size={14} className="text-red-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {profile.restrictions.includes('Outro') && (
              <input
                autoFocus
                className="w-full mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                placeholder="Descreva outra restrição..."
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const nextDisabled =
    (step === 1 && !profile.name) ||
    (step === 9 && (!profile.restrictions || profile.restrictions.length === 0));

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 bg-white p-8 pt-12 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          className={`p-4 rounded-2xl transition-all ${
            step > 1 ? 'bg-gray-50' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronUp className="-rotate-90 text-gray-400" size={20} />
        </button>

        <div className="flex flex-col items-center">
          <p className="text-xs font-bold text-gray-400">
            Passo {step} de {totalSteps}
          </p>

          <div className="flex gap-1 mt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i + 1 <= step ? 'w-4 bg-green-500' : 'w-2 bg-gray-100'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-4 pb-8 no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="min-h-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-gray-100 bg-white p-6 pb-8">
        <button
          type="button"
          disabled={nextDisabled}
          onClick={next}
          className={`w-full py-5 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
            nextDisabled
              ? 'bg-gray-100 text-gray-400 shadow-none'
              : 'bg-green-500 text-white shadow-green-100'
          }`}
        >
          {step === totalSteps ? 'Gerar Meu Plano' : 'Próximo'}
        </button>
      </div>
    </div>
  );
}


function PlanBuilderScreen({ profile, onComplete }: { profile: UserProfile; onComplete: (finalProfile: UserProfile) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<UserProfile>(profile);
  const [customIng, setCustomIng] = useState('');
  const totalSteps = 4;

  useEffect(() => {
    scrollToTop();
  }, [step]);

  const toggleIng = (cat: keyof UserProfile['preferredIngredients'], ing: string) => {
    const current = data.preferredIngredients[cat] || [];
    let next;
    if (current.includes(ing)) {
      next = current.filter(x => x !== ing);
    } else {
      next = [...current, ing];
    }
    setData({
      ...data,
      preferredIngredients: {
        ...data.preferredIngredients,
        [cat]: next
      }
    });
  };

  const addCustom = (cat: keyof UserProfile['preferredIngredients']) => {
    if (!customIng.trim()) return;
    const suggested = findFuzzyMatch(customIng.trim());
    toggleIng(cat, suggested || customIng.trim());
    setCustomIng('');
  };

  const renderIngredientStep = (cat: keyof UserProfile['preferredIngredients'], title: string, options: string[]) => {
    const filteredOptions = options.filter(opt => !isFoodRestricted(opt, data));

    return (
      <div className="space-y-8 pb-20">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Montagem do Plano</p>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">{title}</h2>
          <p className="text-xs text-gray-400 font-bold">Selecione os ingredientes que você mais gosta.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filteredOptions.length > 0 ? filteredOptions.map(ing => (
            <button 
              key={ing}
              onClick={() => toggleIng(cat, ing)}
              className={`px-4 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${data.preferredIngredients[cat]?.includes(ing) ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-transparent text-gray-400 shadow-sm'}`}
            >
              {ing}
            </button>
          )) : (
            <p className="text-sm font-bold text-gray-400 italic">Nenhum ingrediente padrão disponível com suas restrições. Adicione abaixo.</p>
          )}
        </div>

      <div className="space-y-4 pt-6 border-t border-gray-100">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Outro alimento favorito</p>
        <div className="flex gap-2">
          <input 
            value={customIng}
            onChange={e => setCustomIng(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom(cat)}
            className="flex-1 p-4 bg-gray-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-green-500"
            placeholder={cat === 'breakfast' ? 'Ex: Requeijão light...' : cat === 'main' ? 'Ex: Brócolis, Feijão preto...' : 'Ex: Iogurte, Mix de castanhas...'}
          />
          <button 
            onClick={() => addCustom(cat)}
            className="px-6 bg-green-500 text-white rounded-2xl active:scale-95 transition-all font-black text-xs uppercase"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {data.preferredIngredients[cat]?.filter(p => !options.includes(p)).map(p => (
            <div key={p} className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1.5 rounded-xl border border-green-100 animate-in fade-in zoom-in duration-200">
              <span className="text-[10px] font-black uppercase tracking-tighter">{p}</span>
              <button onClick={() => toggleIng(cat, p)} className="p-1 hover:bg-green-100 rounded-lg">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
    );
  };

  const renderStep = () => {
    switch(step) {
      case 1: return renderIngredientStep('breakfast', 'Café da Manhã', INGREDIENTS.breakfast);
      case 2: return renderIngredientStep('main', 'Almoço', INGREDIENTS.main);
      case 3: return renderIngredientStep('snacks', 'Lanche da Tarde', INGREDIENTS.snacks);
      case 4: return renderIngredientStep('main', 'Jantar', INGREDIENTS.main);
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
       <div className="p-8 pt-12 flex items-center justify-between">
          <button onClick={() => step > 1 && setStep(step - 1)} className={`p-4 rounded-2xl ${step > 1 ? 'bg-gray-50' : 'opacity-0 pointer-events-none'}`}>
             <ChevronUp className="-rotate-90 text-gray-400" size={20} />
          </button>
          <div className="flex flex-col items-center">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Passo {step} de {totalSteps}</p>
             <div className="flex gap-1 mt-2">
                {Array.from({length: totalSteps}).map((_, i) => (
                   <div key={i} className={`h-1 rounded-full transition-all ${i + 1 <= step ? 'w-4 bg-green-500' : 'w-2 bg-gray-100'}`} />
                ))}
             </div>
          </div>
          <div className="w-12" />
       </div>

       <div className="flex-1 px-8 py-4 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
             <motion.div key={step} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                {renderStep()}
             </motion.div>
          </AnimatePresence>
       </div>

       <div className="p-8 pb-12">
          <button 
            disabled={data.preferredIngredients[step === 1 ? 'breakfast' : (step === 3 ? 'snacks' : 'main')].length === 0}
            onClick={() => step < totalSteps ? setStep(step + 1) : onComplete(data)}
            className={`w-full py-5 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
              data.preferredIngredients[step === 1 ? 'breakfast' : (step === 3 ? 'snacks' : 'main')].length === 0 
                ? 'bg-gray-100 text-gray-300 shadow-none' 
                : 'bg-green-500 text-white shadow-green-100'
            }`}
          >
            {step === totalSteps ? 'Gerar Meu Plano' : 'Próximo'}
          </button>
       </div>
    </div>
  );
}

function HistoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { calorieGoal, meals, selectedDate, setSelectedDate } = useApp();
  
  const today = new Date();
  const isSelectedToday = selectedDate.toDateString() === today.toDateString();

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const currentDays = daysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 text-gray-900">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
           <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl p-8 z-10 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black">Ver dia</h2>
                 <button onClick={onClose} className="p-2 bg-gray-100 rounded-xl"><X size={20}/></button>
              </div>

              <div className="bg-gray-50 rounded-3xl p-6 mb-8">
                 <div className="flex justify-between items-center mb-6">
                    <button 
                      onClick={() => {
                        const d = new Date(selectedDate);
                        d.setMonth(d.getMonth() - 1);
                        setSelectedDate(d);
                      }} 
                      className="p-2 bg-white rounded-xl shadow-sm"
                    >
                      <ChevronUp className="-rotate-90 text-green-600" size={18} />
                    </button>
                    <p className="font-black text-sm uppercase tracking-widest text-green-600">
                      {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                    <button 
                      onClick={() => {
                        const d = new Date(selectedDate);
                        d.setMonth(d.getMonth() + 1);
                        setSelectedDate(d);
                      }} 
                      className="p-2 bg-white rounded-xl shadow-sm"
                    >
                      <ChevronUp className="rotate-90 text-green-600" size={18} />
                    </button>
                 </div>
                 <div className="grid grid-cols-7 gap-2">
                    {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="text-[10px] font-black text-gray-300 text-center">{d}</div>)}
                    {Array.from({length: currentDays}).map((_, i) => {
                      const dayNum = i + 1;
                      const dateObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayNum);
                      const isSelected = dateObj.toDateString() === selectedDate.toDateString();
                      
                      return (
                        <div 
                          key={i} 
                          onClick={() => setSelectedDate(dateObj)}
                          className={`aspect-square flex items-center justify-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            isSelected ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex justify-between border-b pb-4 border-gray-100">
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumo de {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</p>
                       <p className="text-2xl font-black text-gray-900">{meals.length > 0 ? (meals.reduce((acc, m) => acc + m.cal, 0) <= calorieGoal ? 'Dentro da Meta' : 'Acima da Meta') : 'Sem registros'}</p>
                    </div>
                    {meals.length > 0 && (
                      <div className="text-right">
                         <p className={`text-3xl font-black ${meals.reduce((acc, m) => acc + m.cal, 0) <= calorieGoal ? 'text-green-500' : 'text-red-500'}`}>
                           {meals.reduce((acc, m) => acc + m.cal, 0)}<span className="text-xs uppercase ml-1">calorias</span>
                         </p>
                      </div>
                    )}
                 </div>
                 
                 {meals.length > 0 ? (
                   <div className="space-y-3">
                      {meals.map(m => (
                        <div key={m.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-[28px] border border-gray-100">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
                                 <Utensils size={18} />
                              </div>
                              <span className="font-extrabold text-gray-800 text-sm uppercase tracking-tighter">{m.type}</span>
                           </div>
                           <span className="font-black text-gray-900">{m.cal} cal</span>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="py-8 text-center bg-gray-50 rounded-3xl">
                      <p className="text-xs font-bold text-gray-300">Nenhum registro</p>
                   </div>
                 )}
              </div>

              <button 
                onClick={onClose} 
                className="w-full py-5 mt-8 bg-green-500 text-white font-black rounded-[32px] text-xs uppercase tracking-widest shadow-xl shadow-green-100 active:scale-95 transition-all"
              >
                Fechar Histórico
              </button>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function HojeScreen({ onGoToList, onNavigate }: { onGoToList: () => void; onNavigate: (s: any) => void }) {
  const {
    userProfile,
    getTotals,
    calorieGoal,
    macros,
    mealCount,
    meals,
    workouts,
    addWorkout,
    deleteWorkout,
    estimateBurned,
    setPendingMealType,
    setPendingEditMealId,
    mealPlan,
    selectedDate,
  } = useApp();

  const totals = getTotals();
  const remaining = Math.max(safeNumber(calorieGoal) - safeNumber(totals.cal), 0);
  const burned = workouts.reduce((acc, w) => acc + safeNumber(w.burned), 0);

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateDisplay = isToday
    ? 'Hoje'
    : selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  const weekday = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  const configs = MEAL_CONFIGS[mealCount];

  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-16">
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />

      {/* Header */}
      <div className="bg-[#16A34A] pt-12 px-6 pb-9 rounded-b-[42px] text-white shadow-xl relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">
              {weekday}, {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </p>

            <h1 className="text-2xl font-black mt-1">
              {isToday
                ? `Olá, ${userProfile?.name?.split(' ')[0] || 'Visitante'} 👋`
                : `Visualizando ${dateDisplay}`}
            </h1>
          </div>

          <button
            onClick={() => setShowHistory(true)}
            className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10 active:scale-95 transition-all"
          >
            <Calendar size={18} />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <CalorieRing
            consumed={totals.cal}
            goal={calorieGoal}
            burned={burned}
          />
        </div>

        <div className="flex justify-center mb-3">
          <div className="bg-white/95 text-[#16A34A] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
            <Zap size={16} className="fill-current shrink-0" />
            <div className="leading-tight">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">
                Disponível hoje
              </p>
              <p className="text-sm font-black uppercase tracking-tight">
                {formatKcal(remaining)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-2 max-w-[320px]">
            <Sparkles size={14} className="text-green-200 shrink-0" />

            <p className="text-[10px] text-white/85 font-bold leading-tight">
              Hoje: O equilíbrio é melhor que a restrição severa.
            </p>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="px-6 mt-4 relative z-20">
        <div className="bg-white rounded-[30px] p-5 shadow-xl border border-gray-50 grid grid-cols-3 gap-4">
          <div className="space-y-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
              Proteína
            </p>
            <ProgressBar val={totals.p} max={macros.p} color={C.protein} />
            <p className="text-[10px] font-black text-gray-900 text-center">
              {formatMacro(totals.p)} <span className="opacity-30 text-[8px]">/ {formatMacro(macros.p)}</span>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
              Carbos
            </p>
            <ProgressBar val={totals.c} max={macros.c} color={C.carbs} />
            <p className="text-[10px] font-black text-gray-900 text-center">
              {formatMacro(totals.c)} <span className="opacity-30 text-[8px]">/ {formatMacro(macros.c)}</span>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
              Gorduras
            </p>
            <ProgressBar val={totals.f} max={macros.f} color={C.fat} />
            <p className="text-[10px] font-black text-gray-900 text-center">
              {formatMacro(totals.f)} <span className="opacity-30 text-[8px]">/ {formatMacro(macros.f)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="px-5 mt-9 space-y-5">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-xl font-black text-gray-900">Refeições</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Registrar refeição
            </p>
          </div>

          <button
            onClick={onGoToList}
            className="text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            Ver dia
          </button>
        </div>

        {configs.map(cfg => {
          const registeredMeals = meals.filter(m => m.type === cfg.key);
          const meal = registeredMeals[0];

          return meal ? (
            <div
              key={cfg.key}
              className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm transition-all"
            >
              <div
                onClick={() => setExpandedMeal(expandedMeal === cfg.key ? null : cfg.key)}
                className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${cfg.color}15` }}>
                    <cfg.icon size={22} style={{ color: cfg.color }} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {cfg.label}
                    </p>
                    <p className="text-xs text-gray-500 font-semibold">
                      {meal.time} · {meal.items.length} itens
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  {registeredMeals.length > 1 && (
                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">
                      +{registeredMeals.length - 1}
                    </span>
                  )}

                  <div className="flex flex-col items-end">
                    <span className="font-black text-gray-900">
                      {registeredMeals.reduce((a, b) => a + b.cal, 0)}{' '}
                      <span className="text-[10px] uppercase opacity-40">calorias</span>
                    </span>
                  </div>

                  {expandedMeal === cfg.key ? (
                    <ChevronUp size={16} className="text-gray-300" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-300" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedMeal === cfg.key && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-gray-50/50"
                  >
                    <div className="p-4 pt-0 border-t border-dashed border-gray-200">
                      <div className="mt-4 space-y-4">
                        {registeredMeals.map((rm, ridx) => (
                          <div key={rm.id} className={`${ridx > 0 ? 'pt-4 border-t border-gray-100' : ''}`}>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                Registro {ridx + 1}
                              </p>

                              <button
                                onClick={() => {
                                  setPendingEditMealId(rm.id);
                                  onNavigate('registrar');
                                }}
                                className="text-[10px] font-black text-green-600 uppercase"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="space-y-2">
                              {rm.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <div>
                                    <p className="text-xs font-bold text-gray-800">
                                      {it.food.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-semibold">
                                      {it.qty}{it.unit === 'g' ? 'g' : (it.food.un || 'un')} · P:{it.p} C:{it.c} G:{it.f}
                                    </p>
                                  </div>

                                  <span className="text-xs font-bold text-gray-500">
                                    {it.cal} calorias
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div
              key={cfg.key}
              className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: `${cfg.color}10` }}>
                  <cfg.icon size={22} style={{ color: cfg.color }} />
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {cfg.label}
                  </p>
                  <p className="text-[10px] text-green-600 font-black uppercase mt-0.5">
                    Sugestão
                  </p>
                </div>
              </div>

              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-start mb-5">
                  <p className="text-xs font-black text-gray-800 flex-1 pr-4">
                    {mealPlan[cfg.key]?.[0]?.name || '---'}
                  </p>
                  <span className="text-[10px] font-black text-green-600 whitespace-nowrap">
                    {mealPlan[cfg.key]?.[0]?.cal || 0} calorias
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPendingMealType(cfg.key);
                    onNavigate('registrar');
                  }}
                 className="inline-flex items-center justify-center rounded-full border border-green-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-700 active:scale-95 transition-all"
                >
                  Registrar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workout */}
      <div className="px-5 mt-8 mb-6">
        <div className="bg-[#FFFBEB] rounded-[30px] p-5 border border-orange-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 rounded-2xl">
                <Flame size={22} className="text-orange-600" />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">Atividades de hoje</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase">
                  Gasto estimado
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWorkoutModal(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all"
            >
              Adicionar treino
            </button>
          </div>

          {workouts.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {workouts.map((w: any) => (
                  <div
                    key={w.id}
                    className="flex justify-between items-center bg-white p-4 rounded-2xl border border-orange-50"
                  >
                    <div>
                      <p className="text-sm font-black text-gray-800">
                        {WORKOUT_TYPES.find((wt: any) => wt.key === w.type)?.label}
                      </p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">
                        {w.duration > 0 ? `${w.duration} min` : 'Manual'} · {w.burned} calorias
                      </p>
                    </div>

                    <button
                      onClick={() => deleteWorkout(w.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-orange-500/10 rounded-2xl p-4 flex justify-between items-center border border-orange-100">
                <p className="text-xs font-black text-orange-800 uppercase">
                  Total gasto no treino
                </p>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-orange-600">
                    {burned}
                  </span>
                  <span className="text-[10px] font-bold text-orange-400 uppercase">
                    calorias
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-orange-800/70 font-semibold leading-relaxed">
              Adicione uma caminhada, corrida ou treino para acompanhar seu gasto do dia.
            </p>
          )}
        </div>
      </div>

      {/* Workout Modal */}
      <AnimatePresence>
        {showWorkoutModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWorkoutModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[44px] sm:rounded-[44px] shadow-2xl p-8 pt-12 z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Novo Exercício
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">
                Adicione um ou mais realizados hoje
              </p>

              <WorkoutForm
                onClose={() => setShowWorkoutModal(false)}
                onSave={(w) => {
                  addWorkout(w);
                  setShowWorkoutModal(false);
                }}
                estimateBurned={estimateBurned}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
function WorkoutForm({ onClose, onSave, estimateBurned }: { onClose: () => void; onSave: (w: Workout) => void; estimateBurned: any }) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [type, setType] = useState<WorkoutType>('musculacao');
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState<Intensity>('moderada');
  const [manualCal, setManualCal] = useState('');

  const estimated = estimateBurned(type, duration, intensity);

  const handleConfirm = () => {
    const burned = mode === 'manual' ? (parseInt(manualCal) || 0) : estimated;
    if (burned <= 0) return;
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      type,
      duration: mode === 'manual' ? 0 : duration,
      intensity: mode === 'manual' ? 'moderada' : intensity,
      burned,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
  };

  return (
    <div className="space-y-8">
       <div className="flex bg-gray-100 p-1.5 rounded-[24px]">
          <button onClick={() => setMode('auto')} className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'auto' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>Estimativa Auto</button>
          <button onClick={() => setMode('manual')} className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>Manual (calorias)</button>
       </div>

       {mode === 'auto' ? (
         <div className="space-y-8">
            <div className="grid grid-cols-3 gap-3">
              {WORKOUT_TYPES.map(wt => (
                <button 
                  key={wt.key} 
                  onClick={() => setType(wt.key)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-3xl border-2 transition-all group ${type === wt.key ? 'border-orange-500 bg-orange-50' : 'border-gray-50 bg-white'}`}
                >
                  <wt.icon size={20} className={type === wt.key ? 'text-orange-500' : 'text-gray-300'} />
                  <span className={`text-[9px] font-black uppercase tracking-tight ${type === wt.key ? 'text-orange-600' : 'text-gray-400'}`}>{wt.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-6">
               <div className="flex justify-between items-end px-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duração (minutos)</p>
                  <p className="text-xl font-black text-gray-900">{duration} min</p>
               </div>
               <input type="range" min="5" max="180" step="5" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full accent-orange-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer" />
               
               <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Intensidade</p>
                  <div className="flex gap-2">
                     {INTENSITIES.map(int => (
                       <button 
                         key={int.key} 
                         onClick={() => setIntensity(int.key as any)}
                         className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${intensity === int.key ? 'bg-white border-orange-500 text-orange-600 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400'}`}
                       >
                         {int.label}
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100 flex justify-between items-center">
               <div>
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Gasto Estimado</p>
                  <p className="text-3xl font-black text-orange-600">{estimated} <span className="text-[10px] uppercase opacity-40">calorias</span></p>
               </div>
               <Flame size={40} className="text-orange-200" />
            </div>
         </div>
       ) : (
         <div className="space-y-8 py-4">
            <div className="flex flex-col items-center">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Calorias Gastas</p>
               <input 
                 autoFocus
                 type="number"
                 placeholder="0"
                 value={manualCal}
                 onChange={e => setManualCal(e.target.value)}
                 className="text-6xl font-black text-gray-900 text-center w-full focus:outline-none bg-transparent"
               />
               <div className="h-1.5 w-24 bg-orange-500 rounded-full mt-4" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium text-center px-8 leading-relaxed">
               Ideal para quem usa smartwatch ou apps que informam o gasto real.
            </p>
         </div>
       )}

       <div className="pt-4 space-y-4">
          <p className="text-[9px] text-gray-400 font-medium italic text-center px-4">
            "As calorias do treino são estimativas. Use como referência, não como obrigação de comer mais."
          </p>
          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 py-5 font-black text-gray-400 bg-gray-50 rounded-3xl text-xs uppercase">Cancelar</button>
            <button onClick={handleConfirm} className="flex-[2] py-5 font-black text-white bg-orange-500 rounded-3xl shadow-xl shadow-orange-100 text-xs uppercase tracking-widest">Salvar Treino</button>
          </div>
       </div>
    </div>
  );
}

function RecipeLibrary() {
  const { userProfile, addRecipeToPlan } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<FitnessRecipe | null>(null);
  const [hiddenRecipeImages, setHiddenRecipeImages] = useState<Record<string, boolean>>({});

  const recipeIsAllowed = (recipe: FitnessRecipe) => {
    if (!userProfile) return true;

    const recipeText = [
      recipe.title,
      recipe.friendlyTitle,
      recipe.description,
      ...(recipe.ingredients || []),
      ...(recipe.tags || []),
      recipe.isEgg ? 'ovo' : '',
      recipe.isLactose ? 'leite iogurte queijo requeijao' : '',
      recipe.isGluten ? 'pao trigo macarrao gluten wrap' : '',
      recipe.isFish ? 'peixe atum tilapia sardinha salmao' : '',
      recipe.isPeanut ? 'amendoim' : '',
      recipe.isSoy ? 'soja tofu' : '',
    ].join(' ');

    return !isFoodRestricted(recipeText, userProfile);
  };

  const visibleRecipes = FITNESS_RECIPES.filter(recipeIsAllowed);
  const configs = userProfile ? MEAL_CONFIGS[userProfile.mealCount] : MEAL_CONFIGS[4];

  // Mostra imagem só nas receitas que estão confiáveis por enquanto.
  const curatedImageIds = new Set([
    'aveia-gelada-banana',
    'panqueca-banana-aveia',
    'wrap-frango',
    'sanduiche-frango',
    'omelete-queijo-tomate',
    'bowl-frango-quinoa',
    'smoothie-morango-iogurte',
  ]);

  const handleAddRecipeToPlan = (recipe: FitnessRecipe, mealKey: string) => {
    addRecipeToPlan(recipe, mealKey as any);
    setSelectedRecipe(null);
    setIsOpen(false);
  };

  return (
    <>
      <div className="px-6 mt-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative w-full overflow-hidden rounded-[34px] p-5 text-left shadow-xl shadow-green-900/10 active:scale-[0.99] transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-emerald-600 to-lime-500" />
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15" />
          <div className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-black/10" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/75">
                Receitas Fitness
              </p>

              <h3 className="text-2xl font-black leading-tight text-white">
                Ver receitas prontas
              </h3>

              <p className="mt-2 max-w-[230px] text-xs font-bold leading-relaxed text-white/80">
                {visibleRecipes.length} receitas prontas com ingredientes, preparo e macros.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-700 shadow-sm">
                Abrir biblioteca
                <ChevronRight size={14} />
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[26px] bg-white/20 text-white backdrop-blur-sm border border-white/20">
              <Utensils size={28} />
            </div>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 px-4 py-6 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto max-w-md rounded-[36px] bg-white p-5 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-green-600">
                    Biblioteca
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-gray-900">
                    Receitas Fitness
                  </h2>

                  <p className="mt-1 text-xs font-bold text-gray-400">
                    Receitas práticas para encaixar no seu plano alimentar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {visibleRecipes.map((recipe) => {
                  const canShowImage =
                    !!recipe.image &&
                    curatedImageIds.has(recipe.id) &&
                    !hiddenRecipeImages[recipe.id];

                  return (
                    <div
                      key={recipe.id}
                      className="overflow-hidden rounded-[30px] border border-gray-100 bg-white shadow-sm"
                    >
                      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100">
                        {canShowImage ? (
                          <img
                            src={recipe.image}
                            alt={recipe.friendlyTitle}
                            className="relative z-10 h-full w-full object-cover"
                            onError={() => {
                              setHiddenRecipeImages((prev) => ({
                                ...prev,
                                [recipe.id]: true,
                              }));
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm">
                              <Utensils size={24} className="text-green-600" />
                            </div>
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

                        <div className="absolute bottom-4 left-4 right-4 z-30">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/75">
                            {recipe.cal} kcal
                          </p>

                          <h4 className="mt-1 text-xl font-black leading-tight text-white">
                            {recipe.friendlyTitle}
                          </h4>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-xs font-bold leading-relaxed text-gray-500">
                          {recipe.description}
                        </p>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="rounded-2xl bg-blue-50 px-3 py-2">
                            <p className="text-[9px] font-black uppercase text-blue-500">
                              Prot.
                            </p>
                            <p className="mt-1 text-sm font-black text-blue-700">
                              {recipe.p}g
                            </p>
                          </div>

                          <div className="rounded-2xl bg-green-50 px-3 py-2">
                            <p className="text-[9px] font-black uppercase text-green-500">
                              Carbo
                            </p>
                            <p className="mt-1 text-sm font-black text-green-700">
                              {recipe.c}g
                            </p>
                          </div>

                          <div className="rounded-2xl bg-orange-50 px-3 py-2">
                            <p className="text-[9px] font-black uppercase text-orange-500">
                              Gord.
                            </p>
                            <p className="mt-1 text-sm font-black text-orange-700">
                              {recipe.f}g
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRecipe(recipe)}
                            className="rounded-2xl border border-gray-200 bg-white px-3 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600"
                          >
                            Ver preparo
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedRecipe(recipe)}
                            className="rounded-2xl bg-green-600 px-3 py-3 text-[10px] font-black uppercase tracking-widest text-white"
                          >
                            Escolher refeição
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 px-4 py-6 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto max-w-md overflow-hidden rounded-[36px] bg-white shadow-2xl">
              <div className="relative h-56 bg-gradient-to-br from-green-50 to-emerald-100">
                {selectedRecipe.image &&
                curatedImageIds.has(selectedRecipe.id) &&
                !hiddenRecipeImages[selectedRecipe.id] ? (
                  <img
                    src={selectedRecipe.image}
                    alt={selectedRecipe.friendlyTitle}
                    className="relative z-10 h-full w-full object-cover"
                    onError={() => {
                      setHiddenRecipeImages((prev) => ({
                        ...prev,
                        [selectedRecipe.id]: true,
                      }));
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Utensils size={34} className="text-green-600" />
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-gray-700"
                >
                  <X size={18} />
                </button>

                <div className="absolute bottom-5 left-5 right-5 z-30">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/75">
                    {selectedRecipe.cal} kcal
                  </p>

                  <h2 className="mt-1 text-2xl font-black leading-tight text-white">
                    {selectedRecipe.friendlyTitle}
                  </h2>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <p className="text-sm font-bold leading-relaxed text-gray-500">
                  {selectedRecipe.description}
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-blue-50 p-3 text-center">
                    <p className="text-[9px] font-black uppercase text-blue-500">Proteína</p>
                    <p className="mt-1 text-lg font-black text-blue-700">{selectedRecipe.p}g</p>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-3 text-center">
                    <p className="text-[9px] font-black uppercase text-green-500">Carbos</p>
                    <p className="mt-1 text-lg font-black text-green-700">{selectedRecipe.c}g</p>
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-3 text-center">
                    <p className="text-[9px] font-black uppercase text-orange-500">Gorduras</p>
                    <p className="mt-1 text-lg font-black text-orange-700">{selectedRecipe.f}g</p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Você vai usar
                  </p>

                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient) => (
                      <div key={ingredient} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                        <p className="text-xs font-bold leading-relaxed text-gray-600">
                          {ingredient}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Modo de preparo
                  </p>

                  <div className="space-y-2">
                    {selectedRecipe.steps.map((step, index) => (
                      <div key={`${selectedRecipe.id}-step-${index}`} className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-black text-green-700">
                          {index + 1}
                        </span>

                        <p className="text-xs font-bold leading-relaxed text-gray-600">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-green-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-700">
                    Por que funciona no plano?
                  </p>

                  <p className="mt-2 text-xs font-bold leading-relaxed text-green-800">
                    {selectedRecipe.whyNutritious}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {configs.map((config) => (
                    <button
                      key={`${selectedRecipe.id}-${config.key}`}
                      type="button"
                      onClick={() => handleAddRecipeToPlan(selectedRecipe, config.key)}
                      className="rounded-2xl border border-green-100 bg-green-50 px-3 py-3 text-[10px] font-black uppercase tracking-widest text-green-700"
                    >
                      Adicionar no {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PlanoScreen() {
  const { userProfile, mealPlan, generateNewPlan, swapMealItem, updateProfile, handleProfileUpdate } = useApp();
  const [showAdjustModal, setShowAdjustModal] = useState(false);

const [blockInput, setBlockInput] = useState('');
const [blockError, setBlockError] = useState('');

const [favoriteInput, setFavoriteInput] = useState('');
const [favoriteError, setFavoriteError] = useState('');

const handleAddBlock = () => {
  const raw = blockInput.trim();

  if (!raw) return;

  const resolvedName = resolveFoodName(raw, FOODS) || findFuzzyMatch(raw);

  if (!resolvedName) {
    setBlockError(`Não encontrei "${raw}" no banco de alimentos.`);
    return;
  }

  const current = userProfile.blockedFoods || [];

  if (current.includes(resolvedName)) {
    setBlockError(`${resolvedName} já está bloqueado.`);
    return;
  }

  handleProfileUpdate({
    blockedFoods: [...current, resolvedName],
  });

  setBlockInput('');
  setBlockError('');
};  
 
  const [activeCategory, setActiveCategory] = useState<'breakfast' | 'main' | 'snacks'>('breakfast');

  if (!userProfile) return null;

  const count = userProfile.mealCount;
  const configs = MEAL_CONFIGS[count];

 const handleAddPref = () => {
  const raw = favoriteInput.trim();

  if (!raw) return;

  const resolvedName = resolveFoodName(raw, FOODS) || findFuzzyMatch(raw);

  if (!resolvedName) {
    setFavoriteError(`Não encontrei "${raw}" no banco de alimentos.`);
    return;
  }

  const current = userProfile.preferredIngredients[activeCategory] || [];

  if (!current.includes(resolvedName)) {
    const updatedPrefs = { ...userProfile.preferredIngredients };
    updatedPrefs[activeCategory] = [...current, resolvedName];

    handleProfileUpdate({
      preferredIngredients: updatedPrefs,
    });
  }

  setFavoriteInput('');
  setFavoriteError('');
};
  const handleRemovePref = (item: string) => {
    const updatedPrefs = { ...userProfile.preferredIngredients };
    updatedPrefs[activeCategory] = (userProfile.preferredIngredients[activeCategory] || []).filter(i => i !== item);
    handleProfileUpdate({ preferredIngredients: updatedPrefs });
  };

  const handleRestrictionToggle = (r: string) => {
    const rL = r.toLowerCase();
    const current = userProfile.restrictions || [];
    const updated = current.includes(rL) ? current.filter(i => i !== rL) : [...current, rL];
    handleProfileUpdate({ restrictions: updated });
  };

  const [showToast, setShowToast] = useState(false);
  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
  <div className="w-full max-w-md bg-gray-50 min-h-screen pb-28 overflow-x-hidden">
       {/* Toast notification */}
       <AnimatePresence>
         {showToast && (
           <motion.div 
             initial={{ y: -50, opacity: 0 }}
             animate={{ y: 20, opacity: 1 }}
             exit={{ y: -50, opacity: 0 }}
             className="fixed top-0 left-0 right-0 z-[200] flex justify-center px-6 pointer-events-none"
           >
             <div className="bg-gray-900 border border-white/10 text-white px-6 py-4 rounded-[28px] shadow-2xl flex items-center gap-3 backdrop-blur-xl">
               <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Check size={16} className="text-white" />
               </div>
               <div>
                  <p className="text-xs font-black uppercase tracking-tight">Plano Atualizado!</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Novas opções geradas com sucesso</p>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

    {/* Header Fixed */}
<div className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 flex justify-between items-end sticky top-0 z-30">
  <div>
    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">
      Meus Objetivos
    </p>

    <h2 className="text-2xl font-black text-gray-900 border-l-4 border-green-500 pl-3 leading-none mt-1">
      Plano Alimentar
    </h2>
  </div>

  <button
    type="button"
    onClick={() => setShowAdjustModal(true)}
    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all"
  >
    <Sliders size={14} />
    Ajustar
  </button>
</div>

<RecipeLibrary />
  <div className="px-6 py-8 space-y-12">
  {configs.map((cfg) => (
    <div key={cfg.key} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50">
          <cfg.icon size={20} className="text-green-600" />
        </div>

        <div>
          <h3 className="font-black text-gray-900 leading-none">
            {cfg.label}
          </h3>

          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
            {mealPlan[cfg.key]?.length || 0} opções geradas
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {(mealPlan[cfg.key] || []).map((opt: any, i: number) => {
          const cleanedQty = orderMealQtyText(
            sanitizeOptionQtyText(opt.qty || ''),
            cfg.key
          );

          const optionMacros = opt.fromRecipe
  ? {
      p: Math.round(safeNumber(opt.p)),
      c: Math.round(safeNumber(opt.c)),
      f: Math.round(safeNumber(opt.f)),
    }
  : getPlanOptionMacros(cleanedQty);

          return (
            <div
            key={`${cfg.key}-${i}-${getPlanOptionSignature(opt)}-${opt.swappedAt || 0}`}
              className="bg-white rounded-[28px] p-5 shadow-md shadow-gray-100/60 border border-gray-100 flex justify-between items-start gap-4 group relative overflow-hidden transition-all hover:shadow-green-100/60"
            >
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-2 mb-2">
                  {opt.badge === 'Recomendada' && (
                    <span className="bg-green-500 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-md">
                      Recomendada
                    </span>
                  )}

                  {opt.badge === 'Simples' && (
                    <span className="bg-amber-100 text-amber-700 text-[7px] font-black uppercase px-2 py-0.5 rounded-md">
                      Simples
                    </span>
                  )}

                  {opt.badge === 'Leve' && (
                    <span className="bg-cyan-50 text-cyan-500 text-[7px] font-black uppercase px-2 py-0.5 rounded-md">
                      Leve
                    </span>
                  )}

                  {opt.badge === 'Menos proteína' && (
                    <span className="bg-[#FEF3C7] text-[#92400E] text-[7px] font-black uppercase px-2 py-0.5 rounded-md">
                      Menos proteína
                    </span>
                  )}

                  {!opt.badge && i === 0 && (
                    <span className="bg-green-500 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-md">
                      Recomendada
                    </span>
                  )}
                  {opt.badge === 'Receita' && (
  <span className="bg-purple-50 text-purple-600 text-[7px] font-black uppercase px-2 py-0.5 rounded-md border border-purple-100">
    Receita
  </span>
)}
                </div>

                <h4 className="text-sm font-black text-gray-900 mb-2 leading-tight uppercase tracking-tight">
                  {opt.name}
                </h4>

                <div className="flex flex-col gap-1.5 mb-4">
                  {cleanedQty.split(' + ').map((q: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 opacity-60">
                      <div className="w-1 h-1 bg-green-500 rounded-full" />

                      <span className="text-[10px] font-bold text-gray-500">
                        {q}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-blue-50 text-blue-700 rounded-2xl px-3 py-2 border border-blue-100">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">
                      Prot.
                    </p>

                    <p className="text-sm font-black leading-none mt-1">
                      {optionMacros.p}g
                    </p>
                  </div>

                  <div className="bg-green-50 text-green-700 rounded-2xl px-3 py-2 border border-green-100">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">
                      Carbo
                    </p>

                    <p className="text-sm font-black leading-none mt-1">
                      {optionMacros.c}g
                    </p>
                  </div>

                  <div className="bg-orange-50 text-orange-700 rounded-2xl px-3 py-2 border border-orange-100">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">
                      Gord.
                    </p>

                    <p className="text-sm font-black leading-none mt-1">
                      {optionMacros.f}g
                    </p>
                  </div>
                </div>

<button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
swapMealItem(cfg.key, i);
  }}
  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 rounded-2xl text-[10px] font-black uppercase tracking-wide transition-all active:scale-95"
>
  <Shuffle size={13} />
  Trocar opção
</button>
              </div>

              <div className="text-right flex flex-col items-end pl-3 border-l border-gray-50 min-w-[58px]">
                <p className="text-xl font-black text-gray-900 leading-none">
                  {Math.round(safeNumber(opt.cal))}
                </p>

                <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter mt-1">
                  calorias
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ))}
       </div>
  
      <AnimatePresence>
  {showAdjustModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 shadow-inner backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl no-scrollbar"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 border-l-4 border-green-500 pl-4 uppercase tracking-tighter">
            Ajustar Plano
          </h2>

          <button
            onClick={() => setShowAdjustModal(false)}
            className="p-3 bg-gray-100 rounded-2xl active:scale-90 transition-all text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8 text-left">
          {/* Perfil Alimentar */}
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">
              Perfil Alimentar
            </p>

            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'sem_restricao', label: 'Sem Restrição' },
                { id: 'vegetariano', label: 'Vegetariano' },
                { id: 'vegano', label: 'Vegano' },
                { id: 'pescetariano', label: 'Pescetariano' },
              ] as const).map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProfileUpdate({ dietaryProfile: p.id })}
                  className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                    userProfile.dietaryProfile === p.id ||
                    (!userProfile.dietaryProfile && p.id === 'sem_restricao')
                      ? 'bg-green-50 border-green-500 text-green-600 shadow-sm'
                      : 'bg-white border-transparent text-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Restrições */}
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">
              Restrições / alergias
            </p>

            <div className="flex flex-wrap gap-2">
              {['Lactose', 'Glúten', 'Ovo', 'Peixes', 'Amendoim'].map(r => (
                <button
                  key={r}
                  onClick={() => handleRestrictionToggle(r)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                    userProfile.restrictions.includes(r.toLowerCase())
                      ? 'bg-red-50 border-red-500 text-red-600 shadow-sm'
                      : 'bg-white border-transparent text-gray-400'
                  }`}
                >
                  Sem {r}
                </button>
              ))}
            </div>
          </div>

          {/* Estilo das refeições */}
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">
              Estilo das refeições
            </p>

            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-4">
              {configs.map(m => (
                <div key={m.key} className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase">
                    {m.label}
                  </p>

                  <div className="flex bg-white p-1 rounded-xl shadow-sm">
                    {([
                      { id: 'balanced', label: 'Completa' },
                      { id: 'simple', label: 'Simples' },
                    ] as const).map(style => (
                      <button
                        key={style.id}
                        onClick={() => {
                          const styles = { ...(userProfile.mealStyles || {}) };
                          styles[m.key] = style.id;
                          handleProfileUpdate({ mealStyles: styles });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all whitespace-nowrap flex-1 ${
                          userProfile.mealStyles?.[m.key] === style.id ||
                          (!userProfile.mealStyles?.[m.key] && style.id === 'balanced')
                            ? 'bg-green-500 text-white shadow-md'
                            : 'text-gray-300'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Não quero no plano */}
          <div>
            <div className="flex justify-between items-center mb-4 px-1">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Não quero no plano
              </p>

              <span className="text-[8px] font-bold text-gray-300 uppercase">
                Bloqueados
              </span>
            </div>

            <div className="bg-gray-50 rounded-[28px] p-4 border border-gray-100 mb-4">
              <div className="flex gap-3">
                <input
                  value={blockInput}
                  onChange={e => {
                    setBlockInput(e.target.value);
                    setBlockError('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleAddBlock()}
                  placeholder="Ex: coentro, manteiga, cuscuz..."
                  className="flex-1 bg-white border border-gray-100 px-4 py-3 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-400 outline-none placeholder:text-gray-300"
                />

                <button
                  onClick={handleAddBlock}
                  className="px-4 bg-red-500 text-white rounded-2xl active:scale-95 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>

              {blockError && (
                <p className="mt-3 text-[11px] font-bold text-red-500 leading-relaxed">
                  {blockError}
                </p>
              )}

              <p className="mt-3 text-[10px] font-semibold text-gray-400 leading-relaxed">
                Digite o nome de um alimento existente no banco. Se ele não existir, adicione o alimento antes de bloquear.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {(userProfile.blockedFoods || []).map(item => (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={item}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-red-100"
                >
                  <span>{item}</span>

                  <button
                    onClick={() =>
                      handleProfileUpdate({
                        blockedFoods: (userProfile.blockedFoods || []).filter(i => i !== item),
                      })
                    }
                    className="p-1"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Favoritos */}
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">
              Seus favoritos ({activeCategory === 'breakfast' ? 'Café' : activeCategory === 'main' ? 'Pratos' : 'Lanches'})
            </p>

            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-5">
              {(['breakfast', 'main', 'snacks'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${
                    activeCategory === cat
                      ? 'bg-white shadow-sm text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {cat === 'breakfast' ? 'Café' : cat === 'main' ? 'Pratos' : 'Lanches'}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mb-2 bg-gray-50 rounded-2xl p-2 border border-gray-100">
              <input
                value={favoriteInput}
                onChange={e => {
                  setFavoriteInput(e.target.value);
                  setFavoriteError('');
                }}
                onKeyDown={e => e.key === 'Enter' && handleAddPref()}
                placeholder="Buscar favorito..."
                className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 placeholder:text-gray-300"
              />

              <button
                onClick={handleAddPref}
                className="p-3 bg-green-500 text-white rounded-xl active:scale-95 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            {favoriteError && (
              <p className="mb-4 text-[11px] font-bold text-red-500 px-1">
                {favoriteError}
              </p>
            )}

            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {(userProfile.preferredIngredients[activeCategory] || []).map(item => (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={item}
                  className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-green-100"
                >
                  <span>{item}</span>

                  <button
                    onClick={() => handleRemovePref(item)}
                    className="p-1"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            generateNewPlan();
            setShowAdjustModal(false);
            triggerToast();
          }}
          className="w-full py-5 bg-green-500 text-white font-black rounded-[32px] mt-10 text-xs uppercase tracking-widest shadow-xl shadow-green-100 active:scale-95 transition-all"
        >
          Salvar Alterações
        </button>
      </motion.div>
    </motion.div>
  )}
      </AnimatePresence>
    </div>
  );
}

function ViewMemberDay({ member, onClose }: { member: any; onClose: () => void }) {
  const {
    meals: myMeals,
    getTotals: getMyTotals,
    calorieGoal: myGoal,
    workouts: myWorkouts,
  } = useApp();

  const isMe = member.id === 'me';

  const totals = isMe
    ? getMyTotals()
    : { cal: safeNumber(member.consumed), p: 0, c: 0, f: 0 };

  const goal = isMe ? myGoal : 1800 + (safeNumber(member.consumed) % 500);

  const workouts = isMe
    ? myWorkouts
    : member.workouts?.length
    ? member.workouts
    : member.trained
    ? [{ type: 'Musculação', burned: 350, duration: 45 }]
    : [];

  const burned = workouts.reduce(
    (acc: number, workout: any) => acc + safeNumber(workout.burned),
    0
  );

  const remaining = Math.max(0, goal - totals.cal);

  const meals = isMe
    ? myMeals
    : [
        {
          type: 'Café da manhã',
          desc: 'Pão integral com ovos',
          cal: 320,
          time: '08:15',
        },
        {
          type: 'Almoço',
          desc: 'Arroz, feijão preto e frango',
          cal: 559,
          time: '12:30',
        },
        {
          type: 'Lanche da tarde',
          desc: 'Iogurte com granola',
          cal: 361,
          time: '16:00',
        },
      ];

  const formatMealType = (type: string) => {
    const normalized = String(type || '').toLowerCase();

    if (normalized === 'cafe' || normalized === 'café da manhã') return 'Café da manhã';
    if (normalized === 'almoco' || normalized === 'almoço') return 'Almoço';
    if (normalized === 'jantar') return 'Jantar';
    if (normalized === 'lanche') return 'Lanche da tarde';
    if (normalized === 'lanchemanha') return 'Lanche da manhã';
    if (normalized === 'ceia') return 'Ceia';

    return type;
  };

  const getMealDescription = (meal: any) => {
    if (!isMe) return meal.desc || '';

    return meal.items?.map((item: any) => item.food.name).join(', ') || '';
  };

  const getWorkoutName = (workout: any) => {
    if (workout.type === 'musculacao') return 'Musculação';

    return WORKOUT_TYPES.find(wt => wt.key === workout.type)?.label || workout.type || 'Treino';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 text-gray-900">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: 24, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 24, scale: 0.96, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-[36px] shadow-2xl z-10 max-h-[88vh] overflow-y-auto no-scrollbar relative"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-6 pt-6 pb-4 border-b border-gray-100 rounded-t-[36px]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-500 text-lg shadow-sm overflow-hidden shrink-0">
                {member.imgUrl ? (
                  <img
                    src={member.imgUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  member.img
                )}
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-black truncate">
                  {member.name} {isMe && '(Você)'}
                </h2>

                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest truncate">
                  {member.status || 'Ativo agora'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-7">
          {/* Resumo */}
          <div className="space-y-3">
            <div className="bg-indigo-600 rounded-[30px] p-5 text-white shadow-xl shadow-indigo-100">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">
                Resumo do dia
              </p>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                    Hoje
                  </p>

                  <p className="text-4xl font-black leading-none mt-1">
                    {Math.round(totals.cal)}
                  </p>

                  <p className="text-[10px] font-bold text-white/70 mt-1">
                    calorias
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                    Restante
                  </p>

                  <p className="text-2xl font-black leading-none mt-1">
                    {Math.round(remaining)}
                  </p>

                  <p className="text-[9px] font-bold text-white/60 mt-1">
                    sem contar treino
                  </p>
                </div>
              </div>
            </div>
<p className="text-center text-[10px] font-bold text-white/55">
  Meta diária: {Math.round(goal)} calorias
</p>

          {/* Refeições */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Refeições de hoje
              </p>

              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {meals.length}
              </span>
            </div>

            <div className="space-y-3">
              {meals.length > 0 ? (
                (meals as any[]).map((meal: any, index: number) => (
                  <div
                    key={`${meal.type}-${meal.time}-${index}`}
                    className="bg-gray-50/80 p-4 rounded-[26px] border border-gray-100"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                          {formatMealType(meal.type)}
                        </p>

                        <p className="text-[10px] font-bold text-gray-500 leading-relaxed mt-1 line-clamp-2">
                          {getMealDescription(meal)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-indigo-600">
                          {Math.round(safeNumber(meal.cal))}
                        </p>

                        <p className="text-[8px] font-bold text-gray-300 uppercase">
                          calorias
                        </p>

                        <p className="text-[8px] font-bold text-gray-300 mt-1">
                          {meal.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Nenhuma refeição registrada hoje.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Treinos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Treinos de hoje
              </p>

              <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                {Math.round(burned)} calorias
              </span>
            </div>

            <div className="space-y-3">
              {workouts.length > 0 ? (
                workouts.map((workout: any, index: number) => (
                  <div
                    key={`${workout.type}-${index}`}
                    className="flex justify-between items-center bg-orange-50/60 p-4 rounded-[26px] border border-orange-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0">
                        <Dumbbell size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate">
                          {getWorkoutName(workout)}
                        </p>

                        <p className="text-[10px] font-bold text-gray-400">
                          {safeNumber(workout.duration) > 0
                            ? `${workout.duration} min`
                            : 'Manual'}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] font-black text-orange-600 shrink-0">
                      {Math.round(safeNumber(workout.burned))} calorias
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Nenhum treino registrado hoje.
                  </p>
                </div>
              )}
            </div>
          </div>
                  </div>
        </div>
      </motion.div>
    </div>
  );
}

function IncentiveQuick({ handleIncentive }: { handleIncentive: (m: string) => void }) {
  const categories = [
    { label: 'Elogiar', items: ["Mandou bem no prato! 👏", "Refeição nota 10! 😋", "Equilíbrio perfeito! 🥗", "Inspiração pro grupo! ✨"] },
    { label: 'Motivar', items: ["Foco na meta! 🚀", "Continua firme! 💪", "Não para agora! 🔥", "Você consegue! 👊"] },
    { label: 'Lembrar', items: ["Beba água! 💧", "Já treinou hoje? 👟", "Bateu a proteína? 🍗", "Dorme cedo! 😴"] }
  ];

  return (
    <div className="flex flex-col gap-6">
       {categories.map(cat => (
         <div key={cat.label}>
           <p className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 ml-2">{cat.label}</p>
           <div className="flex flex-wrap gap-2 text-gray-900">
              {cat.items.map(msg => (
                 <button 
                   key={msg} 
                   onClick={() => handleIncentive(msg)} 
                   className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[9px] font-bold text-gray-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all active:scale-95 whitespace-nowrap"
                 >
                    {msg}
                 </button>
              ))}
           </div>
         </div>
       ))}
    </div>
  );
}

function CirculoScreen() {
  const { userProfile, myCheckin, getTotals, calorieGoal, meals, workouts } = useApp();
  const totals = getTotals();
  const workoutCalories = workouts.reduce((sum, workout) => sum + workout.burned, 0);
  const restanteHoje = Math.max(0, calorieGoal - totals.cal);
  const burned = workouts.reduce((acc, w) => acc + safeNumber(w.burned), 0);
  
  const [activeCircle, setActiveCircle] = useState('Thiago & Partners');
  const [circles, setCircles] = useState(['Thiago & Partners', 'Família', 'Projeto Verão']);
  const [reactions, setReactions] = useState<Record<string, { emoji: string; count: number }[]>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string>>({}); 
  const [incentiveFeedback, setIncentiveFeedback] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState<any>(null);
  const [newCircleName, setNewCircleName] = useState('');
  const [supportFeed, setSupportFeed] = useState<{ id: string; msg: string; time: string; user: string }[]>([]);

  const membersData = useMemo(() => {
      const me = { 
        id: 'me', 
        name: userProfile?.name || 'Você', 
        consumed: totals.cal, 
        remaining: Math.round(Math.max(0, calorieGoal - totals.cal)),
        img: '👤', 
        imgUrl: userProfile?.profilePicture,
        status: 'Online', 
        trained: myCheckin === 'treino' 
      };
    
    if (activeCircle === 'Thiago & Partners') {
      return [
        me,
        { 
          id: 'p1', name: 'Partner ❤️', consumed: 1240, remaining: 560, img: '👩', status: 'Ativo(a) há 5m', trained: true,
          workouts: [{ type: 'Musculação', burned: 280, duration: 45 }] 
        },
        { id: 'p2', name: 'Lucas Silva', consumed: 1850, remaining: -50, img: '👨', status: 'Ativo(a) há 2h', trained: false },
        { 
          id: 'p3', name: 'Ana Souza', consumed: 920, remaining: 880, img: '👩', status: 'Ativo(a) há 1h', trained: true,
          workouts: [
            { type: 'Yoga', burned: 120, duration: 50 },
            { type: 'Caminhada', burned: 150, duration: 30 }
          ]
        },
      ];
    }
    if (activeCircle === 'Família') {
      return [
        me,
        { id: 'f1', name: 'Mãe', consumed: 850, remaining: 350, img: '👵', status: 'Ativo(a) há 15m', trained: false },
        { 
          id: 'f2', name: 'Pai', consumed: 1560, remaining: 440, img: '👴', status: 'Ativo(a) há 3h', trained: true,
          workouts: [{ type: 'Pilates', burned: 180, duration: 40 }]
        },
      ];
    }
    return [me, { 
      id: 'v1', name: 'Marcos', consumed: 2100, remaining: 100, img: '🏋️', status: 'Focado', trained: true,
      workouts: [{ type: 'Crossfit', burned: 450, duration: 60 }]
    }];
  }, [activeCircle, userProfile, totals, calorieGoal, burned, myCheckin]);

 const feedItems = useMemo(() => {
  const getSortValue = (item: any) => {
    if (/^\d+$/.test(String(item.id))) {
      return Number(item.id);
    }

    const time = String(item.time || '00:00');
    const [hour, minute] = time.split(':').map(Number);

    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      return hour * 60 + minute;
    }

    return 0;
  };

  const myShared = meals.filter(m => m.shared).map(m => ({
    id: m.id,
    userName: userProfile?.name || 'Você',
    type: m.type,
    desc: m.items.map(it => it.food.name).join(', '),
    cal: m.cal,
    time: m.time,
    photo: m.photo,
    isMessage: false,
  }));

  const mockShared = activeCircle === 'Thiago & Partners'
    ? [
        {
          id: 'mock-1230',
          userName: 'Partner ❤️',
          type: 'almoco',
          desc: 'Arroz, feijão preto e frango',
          cal: 559,
          time: '12:30',
          photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
          isMessage: false,
        },
        {
          id: 'mock-1645',
          userName: 'Lucas Silva',
          type: 'lanche',
          desc: 'Whey Protein com aveia',
          cal: 320,
          time: '16:45',
          photo: null,
          isMessage: false,
        },
      ]
    : activeCircle === 'Família'
    ? [
        {
          id: 'mock-0745',
          userName: 'Mãe',
          type: 'cafe',
          desc: 'Frutas com iogurte',
          cal: 210,
          time: '07:45',
          photo: null,
          isMessage: false,
        },
      ]
    : [];

  const messages = supportFeed.map(s => ({
    id: s.id,
    userName: s.user,
    type: 'message',
    desc: s.msg,
    cal: 0,
    time: s.time,
    photo: null,
    isMessage: true,
  }));

  return [...messages, ...myShared, ...mockShared].sort(
    (a, b) => getSortValue(b) - getSortValue(a)
  );
}, [meals, userProfile, supportFeed, activeCircle]);

  const handleReaction = (mealId: string, emoji: string) => {
    setMyReactions(prev => {
      const current = prev[mealId];
      if (current === emoji) {
        // Toggle off
        const next = { ...prev };
        delete next[mealId];
        return next;
      }
      // Toggle to new emoji
      return { ...prev, [mealId]: emoji };
    });

    setReactions(prev => {
      const current = prev[mealId] || [];
      const userEmoji = myReactions[mealId];
      let next = [...current];

      // If user had a reaction, decrement it
      if (userEmoji) {
        const oldIdx = next.findIndex(r => r.emoji === userEmoji);
        if (oldIdx >= 0) {
          next[oldIdx] = { ...next[oldIdx], count: Math.max(0, next[oldIdx].count - 1) };
        }
      }

      // If new emoji is the same as old, we already toggled off in setMyReactions
      // But here we just handle the increment if it's different
      if (userEmoji !== emoji) {
        const newIdx = next.findIndex(r => r.emoji === emoji);
        if (newIdx >= 0) {
          next[newIdx] = { ...next[newIdx], count: next[newIdx].count + 1 };
        } else {
          next.push({ emoji, count: 1 });
        }
      }

      return { ...prev, [mealId]: next.filter(r => r.count > 0) };
    });
  };

  const handleIncentive = (msg: string) => {
    setIncentiveFeedback(`Enviado: ${msg.replace(/['"]/g, '')}`);
    const newSupport = {
      id: Date.now().toString(),
      msg: msg.replace(/['"]/g, ''),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      user: userProfile?.name || 'Você'
    };
    setSupportFeed(prev => [newSupport, ...prev]);
    setTimeout(() => setIncentiveFeedback(null), 3000);
  };

  return (
    <div className="w-full max-w-md bg-gray-50 min-h-screen pb-20">
       {/* Feedback Pop */}
       <AnimatePresence>
         {incentiveFeedback && (
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl">
              {incentiveFeedback}
           </motion.div>
         )}
       </AnimatePresence>

       <div className="bg-[#8B5CF6] pt-12 px-6 pb-12 rounded-b-[40px] text-white relative shadow-lg">
          <div className="flex justify-between items-center mb-10 relative z-10 font-sans">
             <div>
                <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-1">Comunidade</p>
                <h1 className="text-2xl font-black">{activeCircle}</h1>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10 active:scale-95 transition-all"
                >
                   <UserPlus size={18} />
                </button>
             </div>
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar relative z-10 scroll-smooth">
             {circles.map(c => (
                <button 
                  key={c} 
                  onClick={() => setActiveCircle(c)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${activeCircle === c ? 'bg-white text-indigo-600 border-white/50 scale-105 shadow-xl' : 'bg-indigo-700/30 text-white/60 border-white/10'}`}
                >
                   {c}
                </button>
             ))}
             <button onClick={() => setShowCreateModal(true)} className="p-3 bg-white/10 text-white rounded-2xl border border-white/20 active:scale-95 transition-all"><Plus size={18} /></button>
          </div>
       </div>

       <div className="px-5 mt-10 pb-10 flex flex-col gap-10 text-gray-900 font-sans">
          <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-gray-50 overflow-hidden relative">
             <h3 className="font-black text-gray-900 border-l-4 border-indigo-500 pl-4 uppercase text-[10px] mb-8 tracking-widest">Seu círculo</h3>
             <div className="flex flex-col gap-4">
                {membersData.map((m: any) => (
                   <div key={m.id} className="bg-gray-50/50 rounded-[28px] p-4 border border-gray-100 flex flex-col group active:bg-gray-100 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className="relative">
                             <div className="w-12 h-12 bg-white rounded-[18px] flex items-center justify-center font-black text-indigo-500 shadow-md border border-gray-50 text-lg overflow-hidden">
                               {m.imgUrl ? <img src={m.imgUrl} className="w-full h-full object-cover" /> : m.img}
                             </div>
                             {m.trained && (
                               <div className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
                                 <Zap size={8} fill="currentColor" />
                               </div>
                             )}
                           </div>
                           <div>
                              <p className="text-sm font-black text-gray-900">{m.name}</p>
                              <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">{m.status}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="flex flex-col items-end">
                              <span className="text-base font-black text-indigo-600 leading-none">{Math.round((m.consumed / (m.consumed + m.remaining)) * 100)}%</span>
                              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Meta</span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden mb-4">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (m.consumed / (m.consumed + m.remaining)) * 100)}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                      
                      

                      <button 
                         onClick={() => setShowMemberModal(m)} 
                         className="w-full py-3 bg-white text-indigo-600 rounded-2xl border border-indigo-100 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                      >
                         Ver dia
                      </button>
                   </div>
                ))}
             </div>
          </div>


          {/* Activity Feed */}
          <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-gray-50">
             <h3 className="font-black text-gray-900 border-l-4 border-indigo-500 pl-4 uppercase text-[10px] mb-8 tracking-widest text-center">Atualizações</h3>
             <div className="space-y-8">
                {feedItems.map((item) => (
                   <div key={item.id} className="relative pl-6 border-l-2 border-indigo-50 pb-2">
                      <div className="absolute -left-[5px] top-0 w-2 h-2 bg-indigo-500 rounded-full ring-4 ring-indigo-50" />
                      
                      {item.isMessage ? (
                        <div className="bg-indigo-50/50 rounded-[28px] p-6 border border-indigo-100 mb-2 shadow-sm italic">
                           <div className="flex justify-between items-center mb-2">
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.userName} enviou:</p>
                              <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-tighter">{item.time}</span>
                           </div>
                           <p className="text-sm font-bold text-gray-800 leading-relaxed">{item.desc}</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex-1 pr-4">
                                <p className="text-sm font-black text-gray-900 flex items-center flex-wrap gap-2">
                                  {item.userName} 
                                  <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    {MEAL_CONFIGS[4].find(c => c.key === item.type)?.label || item.type}
                                  </span>
                                </p>
                                <p className="text-xs font-bold text-gray-500 mt-1.5 leading-snug">{item.desc}</p>
                             </div>
                             <span className="text-[9px] font-black text-gray-300 uppercase tracking-tight text-right w-16 whitespace-nowrap">{item.time}</span>
                          </div>

                          <div className="w-full aspect-[4/3] rounded-[34px] overflow-hidden bg-green-50 my-4 border border-green-100 relative">
  {item.photo ? (
    <img
      src={item.photo}
      alt={item.desc || 'Refeição registrada'}
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
    />
  ) : null}

  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-green-50 to-emerald-100">
    <div className="w-14 h-14 rounded-3xl bg-white flex items-center justify-center shadow-sm mb-3">
      <Camera size={24} className="text-green-600" />
    </div>

    <p className="text-sm font-black text-green-800">
      Refeição registrada
    </p>

    <p className="text-[11px] font-bold text-green-600 mt-1">
      Sem foto publicada
    </p>
  </div>
</div>

                          <div className="flex items-center justify-between mt-4">
                             <div className="flex items-center gap-2 px-1">
                               <Rocket size={12} className="text-indigo-400" />
                               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.cal} calorias</span>
                             </div>
                             <div className="flex gap-1.5">
                                {['👏', '🔥', '💪', '🚀'].map(emoji => (
                                   <button 
                                     key={emoji} 
                                     onClick={() => handleReaction(item.id, emoji)}
                                     className={`w-10 h-10 flex items-center justify-center rounded-2xl text-base transition-all active:scale-90 hover:shadow-md ${myReactions[item.id] === emoji ? 'bg-indigo-100 border-2 border-indigo-200 text-lg' : 'bg-gray-50/50 hover:bg-gray-100 border border-transparent'}`}
                                   >
                                      <span className="relative">
                                         {emoji}
                                         {(reactions[item.id] || []).find(r => r.emoji === emoji)?.count > 0 && (
                                           <span className="absolute -top-3 -right-3 text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full shadow-lg">{(reactions[item.id] || []).find(r => r.emoji === emoji)?.count}</span>
                                         )}
                                      </span>
                                   </button>
                                ))}
                             </div>
                          </div>
                        </>
                      )}
                   </div>
                ))}
             </div>

             <div className="mt-12 pt-10 border-t border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 text-center italic">Incentivo Rápido</p>
                <div className="flex flex-wrap gap-2 justify-center">
                   {["Boa refeição!", "Mandou bem!", "No foco!", "Toma água!", "🚀🚀🚀"].map(msg => (
                      <button 
                        key={msg} 
                        onClick={() => handleIncentive(msg)} 
                        className="px-5 py-3 bg-indigo-50/30 text-indigo-600 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
                      >
                         {msg}
                      </button>
                   ))}
                </div>
             </div>
          </div>
       </div>

       <AnimatePresence>
         {showCreateModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-gray-900">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[48px] p-10 shadow-2xl z-10 space-y-8">
               <div className="text-center">
                 <div className="w-20 h-20 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
                   <Users size={40} />
                 </div>
                 <h2 className="text-2xl font-black tracking-tight">Criar Círculo</h2>
                 <p className="text-xs text-gray-400 font-bold mt-2">Convide amigos e motivem-se juntos.</p>
               </div>
               
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nome do Grupo</label>
                 <input 
                   autoFocus 
                   value={newCircleName} 
                   onChange={e => setNewCircleName(e.target.value)} 
                   className="w-full p-5 bg-gray-50 rounded-[28px] font-bold border-none focus:ring-2 focus:ring-indigo-500 shadow-inner text-sm" 
                   placeholder="Ex: Time Madrugada" 
                 />
               </div>
               
               <div className="flex gap-3 pt-2">
                 <button onClick={() => setShowCreateModal(false)} className="flex-1 py-5 font-black text-gray-400 bg-gray-100 rounded-3xl text-[10px] uppercase tracking-widest">Sair</button>
                 <button 
                   onClick={() => { 
                     if(newCircleName.trim()) {
                       setCircles([...circles, newCircleName]); 
                       setActiveCircle(newCircleName); 
                       setShowCreateModal(false); 
                       setNewCircleName('');
                     }
                   }} 
                   className="flex-[2] py-5 font-black text-white bg-indigo-600 rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100"
                 >
                   Criar Círculo
                 </button>
               </div>
             </motion.div>
           </div>
         )}
         
         {showInviteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-gray-900">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInviteModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[48px] p-12 shadow-2xl z-10 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-20 -mt-20 opacity-50" />
                
                <div className="flex justify-between items-center relative z-10">
                  <h2 className="text-2xl font-black tracking-tight uppercase">Convidar</h2>
                  <button onClick={() => setShowInviteModal(false)} className="p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors shadow-sm"><X size={18}/></button>
                </div>
                
                <div className="space-y-10 relative z-10">
                   <p className="text-xs font-bold text-gray-500 leading-relaxed text-center px-2">Compartilhe o código abaixo. Seus amigos poderão entrar no grupo instantaneamente.</p>
                   
                   <div className="bg-indigo-600 p-10 rounded-[44px] shadow-2xl shadow-indigo-200 text-center relative group overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                     <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-4 opacity-70">Código FitCircle</p>
                     <p className="text-5xl font-black text-white tracking-tighter drop-shadow-xl group-hover:scale-110 transition-transform duration-700">FC-9921</p>
                   </div>
                   
                   <div className="flex flex-col gap-4">
                      <button 
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText('FC-9921');
                            setIncentiveFeedback('Código: FC-9921 copiado!');
                            setTimeout(() => setIncentiveFeedback(null), 2000);
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="w-full py-6 bg-white text-indigo-600 font-black rounded-3xl text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all border-2 border-indigo-50 shadow-md hover:bg-indigo-50 flex items-center justify-center gap-3"
                      >
                         <LayoutGrid size={16} />
                         Copiar Código
                      </button>
                      <button 
                        onClick={async () => {
                          const shareData = {
                            title: 'Convite FitCircle',
                            text: 'Venha treinar comigo no FitCircle! Use meu código para entrar no círculo: FC-9921',
                            url: 'https://fitcircle.app/circle/9921'
                          };
                          try {
                            if (navigator.share) {
                              await navigator.share(shareData);
                            } else {
                              await navigator.clipboard.writeText(shareData.url);
                              setIncentiveFeedback('Link compartilhado');
                              setTimeout(() => setIncentiveFeedback(null), 2000);
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                      >
                         <Share2 size={16} />
                         Enviar convite
                      </button>
                   </div>
                </div>
              </motion.div>
            </div>
         )}

         {showMemberModal && (
            <ViewMemberDay member={showMemberModal} onClose={() => setShowMemberModal(null)} />
         )}
       </AnimatePresence>
    </div>
  );
}

function EditProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { userProfile, updateProfile, handleProfileUpdate, mealCount, setMealCount } = useApp();
  const [profile, setProfile] = useState<Partial<UserProfile>>(userProfile || {});
  const [count, setCount] = useState<MealCount>((userProfile?.mealCount || mealCount) as MealCount);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
      setCount(userProfile.mealCount || mealCount);
    }
  }, [userProfile, mealCount, isOpen]);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = () => {
    handleProfileUpdate({ ...profile, mealCount: count });
    setShowConfirm(true);
    setTimeout(() => {
      setShowConfirm(false);
      onClose();
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile({ ...profile, profilePicture: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl p-8 z-10 max-h-[90vh] overflow-y-auto no-scrollbar">
            {showConfirm && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-[110] bg-white/90 backdrop-blur-sm rounded-[40px] flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-100">
                  <Check size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Perfil Atualizado!</h3>
                <p className="text-sm font-bold text-gray-500 leading-relaxed">Suas metas e plano alimentar foram recalculados automaticamente.</p>
              </motion.div>
            )}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 border-l-4 border-green-500 pl-4 uppercase tracking-tighter">Editar Perfil</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-xl active:scale-90 transition-all text-gray-400 group">
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-8">
               <div className="flex flex-col items-center">
                  <div className="relative group">
                     <div className="w-24 h-24 bg-gray-100 rounded-[32px] overflow-hidden border-4 border-white shadow-lg">
                       {profile.profilePicture ? (
                         <img src={profile.profilePicture} alt="Preview" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-300">
                           <User size={40} />
                         </div>
                       )}
                     </div>
                     <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                     >
                       <Camera size={20} />
                     </button>
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                  {profile.profilePicture && (
                    <button onClick={() => setProfile({ ...profile, profilePicture: undefined })} className="mt-4 text-[10px] font-black uppercase text-red-500 tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-all">Remover foto</button>
                  )}
               </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome</label>
                    <input value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-500 transition-all shadow-inner" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Peso (kg)</label>
                      <input type="number" step="0.1" value={profile.weight || 0} onChange={e => setProfile({...profile, weight: parseFloat(e.target.value) || 0})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Altura (cm)</label>
                      <input type="number" value={profile.height || 0} onChange={e => setProfile({...profile, height: parseInt(e.target.value) || 0})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Objetivo</label>
                    <select value={profile.goal} onChange={e => setProfile({...profile, goal: e.target.value as any})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-none">
                      <option value="perda">Perda de Peso</option>
                      <option value="ganho">Ganho de Massa</option>
                      <option value="manutencao">Manutenção</option>
                      <option value="recomposicao">Recomposição</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Refeições por dia</label>
                  <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map(n => (
                    <button
  key={n}
  type="button"
  onClick={() => setCount(n as any)}
  className={`py-3 rounded-xl font-black text-xs border transition-all ${
    count === n
      ? 'bg-green-500 text-white border-green-500 shadow-lg'
      : 'bg-gray-100 text-gray-600 border-gray-200'
  }`}
>
  {n}
</button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Treinos por semana</label>
                  <div className="grid grid-cols-8 gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                      <button
  key={n}
  type="button"
  onClick={() => setProfile({ ...profile, trainingsPerWeek: n })}
  className={`py-3 rounded-xl font-black text-[10px] border transition-all ${
    profile.trainingsPerWeek === n
      ? 'bg-green-500 text-white border-green-500 shadow-lg'
      : 'bg-gray-100 text-gray-600 border-gray-200'
  }`}
>
  {n}
</button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={onClose} className="flex-1 py-4 font-black text-gray-400 bg-gray-100 rounded-3xl uppercase text-xs">Cancelar</button>
                  <button onClick={handleSave} className="flex-[2] py-4 font-black text-white bg-green-500 rounded-3xl shadow-xl shadow-green-100 uppercase text-xs">Salvar Alterações</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function PerfilScreen() {
  const {
    calorieGoal,
    macros,
    userProfile,
    logout,
    resetApp,
    fillDemo,
    updateProfile,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fallbackProfile: UserProfile = {
    name: 'Usuário FitCircle',
    age: 25,
    weight: 70,
    height: 170,
    gender: 'masculino',
    goal: 'perda',
    trainingsPerWeek: 3,
    mealCount: 4,
    dietaryProfile: 'sem_restricao',
    mainDifficulty: '',
    restrictions: [],
    preferredIngredients: {
      breakfast: [],
      main: [],
      snacks: [],
    },
  };

  const [profileDraft, setProfileDraft] = useState<UserProfile>(
    userProfile || fallbackProfile
  );

  useEffect(() => {
    if (userProfile) {
      setProfileDraft(userProfile);
    }
  }, [userProfile]);

  const safeWeight = Math.max(1, safeNumber(userProfile?.weight, 70));
  const safeHeight = Math.max(1, safeNumber(userProfile?.height, 170));
  const bmi = safeWeight / Math.pow(safeHeight / 100, 2);
  const bmiValue = Number.isFinite(bmi) ? bmi.toFixed(1) : '0';

  const goalLabel =
    userProfile?.goal === 'perda'
      ? 'Perda de Peso'
      : userProfile?.goal === 'ganho'
      ? 'Ganho de Massa'
      : userProfile?.goal === 'manutencao'
      ? 'Manutenção'
      : 'Recomposição';

  const getBmiInfo = () => {
    if (!userProfile) {
      return {
        label: 'Não informado',
        color: '#9CA3AF',
        position: 0,
      };
    }

    if (bmi < 18.5) {
      return {
        label: 'Abaixo do peso',
        color: '#60A5FA',
        position: 12,
      };
    }

    if (bmi < 25) {
      return {
        label: 'Faixa saudável',
        color: '#22C55E',
        position: 38,
      };
    }

    if (bmi < 30) {
      return {
        label: 'Sobrepeso',
        color: '#F59E0B',
        position: 63,
      };
    }

    if (bmi < 35) {
      return {
        label: 'Obesidade I',
        color: '#F97316',
        position: 80,
      };
    }

    return {
      label: 'Obesidade II+',
      color: '#EF4444',
      position: 94,
    };
  };

  const bmiInfo = getBmiInfo();

  const saveProfile = () => {
    updateProfile({
      ...profileDraft,
      mealCount: profileDraft.mealCount,
      trainingsPerWeek: profileDraft.trainingsPerWeek,
    });

    setIsEditing(false);
  };

  const handleShare = async () => {
    const text = 'Estou usando o FitCircle para organizar meu plano alimentar.';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FitCircle',
          text,
        });
      } catch {
        // Usuário cancelou o compartilhamento.
      }
    } else {
      alert(text);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-50 min-h-screen pb-32">
      <div className="bg-[#16A34A] pt-12 px-6 pb-12 rounded-b-[42px] text-white text-center relative shadow-xl">
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          className="absolute top-5 right-6 w-10 h-10 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center active:scale-95 transition-all"
        >
          <Info size={17} />
        </button>

        <div className="w-20 h-20 bg-white/20 rounded-[30px] mx-auto mb-4 border-2 border-white/25 flex items-center justify-center p-1 overflow-hidden">
          <div className="w-full h-full bg-white rounded-[26px] flex items-center justify-center overflow-hidden">
            {(userProfile as any)?.profilePicture ? (
              <img
                src={(userProfile as any).profilePicture}
                alt="Perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-black text-[#16A34A] text-2xl">
                {userProfile?.name?.[0] || 'F'}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-xl font-black">
          {userProfile?.name || 'Usuário FitCircle'}
        </h1>

        <p className="text-[10px] font-bold opacity-75 mt-1 uppercase tracking-widest">
          Objetivo: {goalLabel}
        </p>

        <div className="flex justify-center gap-2 mt-5">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-white text-green-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            Editar Perfil
          </button>
        </div>
      </div>

      <div className="px-5 -mt-7 relative z-10 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-lg shadow-gray-100/70 text-center">
            <div className="w-11 h-11 bg-green-50 text-green-600 rounded-2xl mx-auto mb-3 flex items-center justify-center">
              <Utensils size={20} />
            </div>

            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Meta diária
            </p>

            <p className="text-xl font-black text-gray-900 mt-1">
              {Math.round(safeNumber(calorieGoal, 1800))}
            </p>

            <p className="text-[9px] font-bold text-gray-300 uppercase">
              calorias
            </p>
          </div>

          <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-lg shadow-gray-100/70 text-center">
            <div className="w-11 h-11 bg-orange-50 text-orange-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
              <Dumbbell size={20} />
            </div>

            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Treinos
            </p>

            <p className="text-xl font-black text-gray-900 mt-1">
              {safeNumber(userProfile?.trainingsPerWeek, 0)}
            </p>

            <p className="text-[9px] font-bold text-gray-300 uppercase">
              por semana
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-lg shadow-gray-100/70">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">
                Painel corporal
              </p>

              <h2 className="text-lg font-black text-gray-900 mt-1">
                IMC visual
              </h2>
            </div>

            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">
                {bmiValue}
              </p>

              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: bmiInfo.color }}>
                {bmiInfo.label}
              </p>
            </div>

          <div
  className="h-3 rounded-full"
  style={{
    background:
      'linear-gradient(to right, #60A5FA 0%, #60A5FA 18.5%, #22C55E 18.5%, #22C55E 24.9%, #FACC15 24.9%, #FACC15 29.9%, #EF4444 29.9%, #EF4444 100%)',
  }}
/>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-4 shadow-lg"
              style={{
                left: `${Math.min(Math.max(bmiInfo.position, 0), 94)}%`,
                borderColor: bmiInfo.color,
              }}
            />
          </div>

          <div className="flex justify-between mt-3 text-[8px] font-black text-gray-300 uppercase tracking-widest">
            <span>Baixo</span>
            <span>Saudável</span>
            <span>Alto</span>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-lg shadow-gray-100/70">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-4">
            Macros estimados
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
              <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">
                Proteína
              </p>

              <p className="text-lg font-black text-blue-700 mt-1">
                {formatMacro(macros.p)}
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
              <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">
                Carbos
              </p>

              <p className="text-lg font-black text-green-700 mt-1">
                {formatMacro(macros.c)}
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
              <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest">
                Gorduras
              </p>

              <p className="text-lg font-black text-orange-700 mt-1">
                {formatMacro(macros.f)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-lg shadow-gray-100/70">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
              <Smartphone size={22} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-black text-gray-900">
                Instalar FitCircle
              </p>

              <p className="text-[11px] font-bold text-gray-400 leading-relaxed mt-1">
                Adicione o app à tela inicial para acessar mais rápido.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('No navegador do celular, toque em Compartilhar e depois em “Adicionar à Tela de Início”.')}
            className="w-full mt-4 py-3 rounded-2xl bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
          >
            Como instalar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm active:bg-gray-50 transition-all text-left"
          >
            <Share size={20} className="text-green-600 mb-3" />

            <p className="text-sm font-black text-gray-900">
              Compartilhar
            </p>

            <p className="text-[10px] font-bold text-gray-400 mt-1">
              Convide alguém para seu círculo.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm active:bg-gray-50 transition-all text-left"
          >
            <Settings size={20} className="text-green-600 mb-3" />

            <p className="text-sm font-black text-gray-900">
              Preferências
            </p>

            <p className="text-[10px] font-bold text-gray-400 mt-1">
              Ajuste meta, refeições e treinos.
            </p>
          </button>
        </div>

        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-white rounded-[30px] p-5 border border-gray-100 shadow-sm flex items-center justify-between active:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                <X size={18} className="text-gray-500" />
              </div>

              <div className="text-left">
                <p className="font-black text-gray-800 text-sm uppercase tracking-tight">
                  Sair da Conta
                </p>

                <p className="text-[10px] font-bold text-gray-400 mt-1">
                  Encerra a sessão, sem apagar seus dados.
                </p>
              </div>
            </div>

            <ChevronRight size={18} className="text-gray-300" />
          </button>

          <div className="bg-white/60 border border-gray-100 rounded-[28px] p-5 text-center">
            <p className="text-[10px] font-bold text-gray-400 leading-relaxed mb-3">
              Ferramentas de teste e ações sensíveis
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={fillDemo}
                className="text-[10px] font-black text-gray-500 uppercase tracking-widest underline underline-offset-4 active:scale-95 transition-all"
              >
                Usar demo
              </button>

              <span className="w-1 h-1 rounded-full bg-gray-300" />

     <button
  type="button"
  onClick={() => setShowResetConfirm(true)}
  className="mx-auto mt-3 block text-center text-[11px] font-bold text-red-400 underline-offset-4 hover:text-red-500 hover:underline"
>
  Resetar aplicativo
</button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="relative z-10 bg-white w-full max-w-md rounded-[34px] p-6 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                    Perfil
                  </p>

                  <h2 className="text-2xl font-black text-gray-900">
                    Editar perfil
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                    Nome
                  </label>

                  <input
                    value={profileDraft.name || ''}
                    onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-2xl font-bold border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Seu nome"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Idade
                    </label>

                    <input
                      type="number"
                      value={profileDraft.age || 0}
                      onChange={(e) => setProfileDraft({ ...profileDraft, age: parseInt(e.target.value) || 0 })}
                      className="w-full p-4 bg-gray-50 rounded-2xl font-bold border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Peso
                    </label>

                    <input
                      type="number"
                      value={profileDraft.weight || 0}
                      onChange={(e) => setProfileDraft({ ...profileDraft, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full p-4 bg-gray-50 rounded-2xl font-bold border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Altura
                    </label>

                    <input
                      type="number"
                      value={profileDraft.height || 0}
                      onChange={(e) => setProfileDraft({ ...profileDraft, height: parseInt(e.target.value) || 0 })}
                      className="w-full p-4 bg-gray-50 rounded-2xl font-bold border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                    Objetivo
                  </label>

                  <select
                    value={profileDraft.goal}
                    onChange={(e) => setProfileDraft({ ...profileDraft, goal: e.target.value as any })}
                    className="w-full p-4 bg-gray-50 rounded-2xl font-bold border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="perda">Perda de Peso</option>
                    <option value="ganho">Ganho de Massa</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="recomposicao">Recomposição</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-[28px] p-5 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Refeições por dia
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {[3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setProfileDraft({ ...profileDraft, mealCount: n as any })}
                        className={`py-4 rounded-2xl font-black text-sm border transition-all ${
                          profileDraft.mealCount === n
                            ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-100'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-[28px] p-5 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Treinos por semana
                  </p>

                  <div className="grid grid-cols-8 gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setProfileDraft({ ...profileDraft, trainingsPerWeek: n })}
                        className={`py-3 rounded-xl font-black text-[10px] border transition-all ${
                          profileDraft.trainingsPerWeek === n
                            ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-100'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={saveProfile}
                    className="flex-[2] py-4 rounded-2xl bg-green-500 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-green-100 active:scale-95 transition-all"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative z-10 bg-white rounded-[34px] p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-black text-gray-900">
                Sair da conta?
              </h3>

              <p className="text-sm font-bold text-gray-400 mt-2 leading-relaxed">
                Seus dados continuam salvos neste dispositivo.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                 className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="flex-1 py-4 rounded-2xl bg-gray-900 text-white text-xs font-black uppercase"
                >
                  Sair
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative z-10 bg-white rounded-[34px] p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-black text-gray-900">
                Resetar aplicativo?
              </h3>

              <p className="text-sm font-bold text-gray-400 mt-2 leading-relaxed">
                Essa ação limpa seus dados de teste e volta o app para o início.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                 className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 text-xs font-black uppercase"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={resetApp}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white text-xs font-black uppercase"
                >
                  Resetar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="relative z-10 bg-white w-full max-w-sm rounded-[34px] p-6 shadow-2xl"
            >
              <h3 className="text-xl font-black text-gray-900">
                Sobre o Perfil
              </h3>

              <p className="text-sm font-bold text-gray-500 mt-3 leading-relaxed">
                Aqui ficam suas metas, IMC, macros e preferências. Use “Editar Perfil” para ajustar refeições e treinos.
              </p>

              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="w-full mt-6 py-4 rounded-2xl bg-green-500 text-white text-xs font-black uppercase tracking-widest"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
function RegisterWorkoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addWorkout, estimateBurned } = useApp();

  const [type, setType] = useState<any>('musculacao');
  const [duration, setDuration] = useState('45');
  const [intensity, setIntensity] = useState<any>('moderada');
  const [manualCals, setManualCals] = useState('');

  const selectedWorkout =
    WORKOUT_TYPES.find((workout: any) => workout.key === type) ||
    WORKOUT_TYPES[0];

  const estimatedBurned = manualCals
    ? parseInt(manualCals, 10) || 0
    : estimateBurned(type, parseInt(duration, 10) || 45, intensity);

  const handleSave = () => {
    const safeDuration = parseInt(duration, 10) || 45;

    const burned = manualCals
      ? parseInt(manualCals, 10) || 0
      : estimateBurned(type, safeDuration, intensity);

    addWorkout({
      id: Date.now().toString(),
      type,
      duration: safeDuration,
      intensity,
      burned,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="relative z-10 bg-white w-full max-w-sm rounded-[34px] p-6 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                  Treino
                </p>

                <h2 className="text-2xl font-black text-gray-900">
                  Registrar Treino
                </h2>

                <p className="text-xs font-bold text-gray-400 mt-1">
                  Informe o tipo, tempo e intensidade.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center active:scale-95 transition-all"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Tipo de exercício
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {WORKOUT_TYPES.map((workout: any) => {
                    const Icon = workout.icon;
                    const active = type === workout.key;

                    return (
                      <button
                        key={workout.key}
                        type="button"
                        onClick={() => setType(workout.key)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95 ${
                          active
                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        <Icon size={19} />

                        <span className="text-[8px] font-black uppercase tracking-tight text-center leading-tight">
                          {workout.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    Duração
                  </label>

                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl font-black text-gray-900 border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  />

                  <p className="text-[9px] font-bold text-gray-300 uppercase mt-1 ml-1">
                    minutos
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    Calorias
                  </label>

                  <input
                    type="number"
                    placeholder="Auto"
                    value={manualCals}
                    onChange={(e) => setManualCals(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl font-black text-gray-900 border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  />

                  <p className="text-[9px] font-bold text-gray-300 uppercase mt-1 ml-1">
                    opcional
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Intensidade
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {INTENSITIES.map((item: any) => {
                    const active = intensity === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setIntensity(item.key)}
                        className={`py-3 rounded-2xl text-[10px] font-black uppercase border transition-all active:scale-95 ${
                          active
                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-[26px] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-orange-100 flex items-center justify-center text-orange-500">
                    {selectedWorkout?.icon ? <selectedWorkout.icon size={20} /> : <Dumbbell size={20} />}
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      {selectedWorkout?.label || 'Treino'}
                    </p>

                    <p className="text-[10px] font-bold text-orange-500 uppercase">
                      Gasto estimado
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-black text-orange-600">
                    {Math.round(safeNumber(estimatedBurned))}
                  </p>

                  <p className="text-[9px] font-black text-orange-400 uppercase">
                    calorias
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-testid="save-workout"
                onClick={handleSave}
                className="w-full py-5 bg-orange-500 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-xl shadow-orange-100 active:scale-95 transition-all"
              >
                Salvar treino
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function RefeicoesListScreen({
  onBack,
  onEdit,
  onAdd,
}: {
  onBack: () => void;
  onEdit: (id: string) => void;
  onAdd: (type: string) => void;
}) {
  const { mealCount, meals } = useApp();

  const configs = MEAL_CONFIGS[mealCount] || MEAL_CONFIGS[4];

  return (
    <div className="w-full max-w-md bg-gray-50 min-h-screen pb-32">
      <div className="bg-white pt-12 px-6 pb-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-30">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center active:scale-95 transition-all"
        >
          <X size={18} className="text-gray-500" />
        </button>

        <div>
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
            Registrar
          </p>

          <h1 className="text-xl font-black text-gray-900">
            Refeições do Dia
          </h1>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {configs.map((cfg) => {
          const registeredMeals = Array.isArray(meals)
            ? meals.filter((meal: any) => meal.type === cfg.key)
            : [];

          return (
            <div
              key={cfg.key}
              className="bg-white rounded-[30px] p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-xl">
                    {cfg.key === 'cafe'
                      ? '☕'
                      : cfg.key === 'almoco'
                      ? '🍽️'
                      : cfg.key === 'jantar'
                      ? '🌙'
                      : '🍎'}
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      {cfg.label}
                    </p>

                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                      {registeredMeals.length > 0
                        ? `${registeredMeals.length} registro(s)`
                        : 'Ainda não registrado'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAdd(cfg.key)}
                  className="px-4 py-3 rounded-2xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Adicionar
                </button>
              </div>

              {registeredMeals.length > 0 && (
                <div className="mt-4 space-y-2">
                  {registeredMeals.map((meal: any) => (
                    <div
                      key={meal.id}
                      className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-black text-gray-800">
                          {meal.items?.[0]?.food?.name || cfg.label}
                        </p>

                        <p className="text-[10px] font-bold text-gray-400 mt-1">
                          {Math.round(safeNumber(meal.cal || meal.calories))} calorias
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onEdit(meal.id)}
                        className="px-3 py-2 rounded-xl bg-white text-green-600 border border-green-100 text-[9px] font-black uppercase"
                      >
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CirculoScreenFoodstagram() {
  const { userProfile, meals, workouts, calorieGoal, getTotals } = useApp();

  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [hiddenImages, setHiddenImages] = useState<Record<string, boolean>>({});

  const totals = getTotals();
  const consumed = Math.round(safeNumber(totals.cal));
  const goal = Math.round(safeNumber(calorieGoal, 1800));

  const burned = Array.isArray(workouts)
    ? workouts.reduce((sum: number, workout: any) => sum + safeNumber(workout.burned), 0)
    : 0;

  const members = [
    {
      id: 'me',
      name: userProfile?.name || 'Você',
      avatar: '👤',
      status: 'Online',
      consumed,
      goal,
      burned: Math.round(burned),
    },
    {
      id: 'partner',
      name: 'Partner ❤️',
      avatar: '👩',
      status: 'Ativo há 5 min',
      consumed: 1240,
      goal: 2040,
      burned: 280,
    },
    {
      id: 'ana',
      name: 'Ana',
      avatar: 'A',
      status: 'Ativa há 1h',
      consumed: 1580,
      goal: 1900,
      burned: 180,
    },
    {
      id: 'lucas',
      name: 'Lucas',
      avatar: 'L',
      status: 'Ativo hoje',
      consumed: 1720,
      goal: 2100,
      burned: 310,
    },
  ];

  const mealLabel = (type: string) => {
    const configs = [
      ...(MEAL_CONFIGS[3] || []),
      ...(MEAL_CONFIGS[4] || []),
      ...(MEAL_CONFIGS[5] || []),
      ...(MEAL_CONFIGS[6] || []),
    ];

    return configs.find((cfg) => cfg.key === type)?.label || 'Refeição';
  };

  const localMealPosts = Array.isArray(meals)
    ? meals.map((meal: any) => ({
        id: `meal-${meal.id}`,
        author: userProfile?.name || 'Você',
        avatar: '👤',
        title: meal.items?.[0]?.food?.name || `${mealLabel(meal.type)} registrado`,
        subtitle: mealLabel(meal.type),
        calories: Math.round(safeNumber(meal.cal || meal.calories)),
        time: meal.time || 'Hoje',
        image: '',
        type: 'meal',
      }))
    : [];

  const demoPosts = [
    {
      id: 'partner-breakfast',
      author: 'Partner ❤️',
      avatar: '👩',
      title: 'Café da manhã registrado',
      subtitle: 'Começou o dia com consistência',
      calories: 320,
      time: '08:15',
      image: '/recipes/panqueca-banana-aveia.jpg',
      type: 'meal',
    },
    {
      id: 'partner-lunch',
      author: 'Partner ❤️',
      avatar: '👩',
      title: 'Arroz, feijão e frango',
      subtitle: 'Almoço registrado',
      calories: 559,
      time: '12:30',
      image: '/recipes/bowl-frango-quinoa.jpg',
      type: 'meal',
    },
    {
      id: 'partner-workout',
      author: 'Partner ❤️',
      avatar: '👩',
      title: 'Musculação concluída',
      subtitle: '45 min de treino',
      calories: 280,
      time: '10:40',
      image: '',
      type: 'workout',
    },
  ];

  const posts = [...localMealPosts, ...demoPosts];

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <div className="w-full max-w-md bg-gray-50 min-h-screen pb-32">
      <div className="bg-[#16A34A] pt-12 px-6 pb-8 rounded-b-[42px] text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-white/75">
              Círculo
            </p>

            <h1 className="text-2xl font-black mt-1">
              Círculo de apoio
            </h1>

            <p className="text-xs font-bold text-white/75 mt-2 leading-relaxed max-w-[270px]">
              Um feed leve para apoiar seu progresso sem cobrança.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedMember(members[0])}
            className="w-12 h-12 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
            aria-label="Abrir meu resumo"
          >
            <Users size={24} />
          </button>
        </div>

        <div className="mt-6 bg-white/15 border border-white/10 rounded-[28px] p-4 backdrop-blur-md flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white text-orange-500 flex items-center justify-center shadow-lg text-2xl">
            🔥
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
              Ofensiva compartilhada
            </p>

            <p className="text-sm font-black leading-snug mt-1">
              Vocês bateram a meta juntos por 3 dias seguidos!
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-[30px] border border-gray-100 shadow-xl shadow-gray-100/70 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">
              Seu círculo
            </p>

            <button
              type="button"
              onClick={() => setSelectedMember(members[0])}
              className="px-3 py-2 rounded-2xl bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Ver dia
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMember(member)}
                className="min-w-[68px] flex flex-col items-center gap-2 active:scale-95 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-xl font-black text-green-700 shadow-sm">
                  {member.avatar}
                </div>

                <span className="text-[10px] font-black text-gray-700 truncate max-w-[66px]">
                  {member.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-2">
              Atualizações
            </p>

            <h2 className="text-xl font-black text-gray-900">
              O que rolou hoje
            </h2>
          </div>

          {posts.map((post) => {
            const liked = !!likedPosts[post.id];
            const shouldShowImage = Boolean(post.image) && !hiddenImages[post.id];

            return (
              <div
                key={post.id}
                className="bg-white rounded-[34px] border border-gray-100 shadow-xl shadow-gray-100/70 overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-lg shrink-0">
                      {post.avatar}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">
                        {post.author}
                      </p>

                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        {post.time}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleLike(post.id)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all active:scale-90 text-xl ${
                      liked
                        ? 'bg-red-50 border-red-100 text-red-500'
                        : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                    aria-label="Curtir"
                  >
                    {liked ? '❤️' : '🤍'}
                  </button>
                </div>

                <div className="mx-4 h-52 rounded-[28px] overflow-hidden bg-green-50 border border-green-100 flex items-center justify-center">
                  {shouldShowImage ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setHiddenImages((prev) => ({ ...prev, [post.id]: true }));
                      }}
                    />
                  ) : (
                    <div className="text-center px-6">
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">
                        {post.type === 'workout' ? (
                          <Activity size={38} className="text-green-600" />
                        ) : (
                          <Camera size={38} className="text-green-600" />
                        )}
                      </div>

                      <p className="text-sm font-black text-green-700">
                        {post.type === 'workout' ? 'Treino registrado' : 'Registro do dia'}
                      </p>

                      <p className="mt-1 text-[11px] font-bold text-green-600">
                        {post.type === 'workout' ? 'Movimento registrado' : 'Sem foto publicada'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-black text-gray-900 leading-tight">
                        {post.title}
                      </p>

                      <p className="text-xs font-bold text-gray-400 mt-1">
                        {post.subtitle}
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-2xl px-3 py-2 text-right shrink-0">
                      <p className="text-base font-black text-green-600">
                        {Math.round(safeNumber(post.calories))}
                      </p>

                      <p className="text-[8px] font-black text-green-500 uppercase">
                        calorias
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {posts.length === 0 && (
            <div className="bg-white rounded-[34px] p-8 border border-gray-100 shadow-sm text-center">
              <p className="text-sm font-bold text-gray-400 leading-relaxed">
                Nenhuma atividade recente ainda.
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="relative z-10 bg-white w-full max-w-sm rounded-[34px] p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-xl font-black text-green-700">
                    {selectedMember.avatar}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-green-600">
                      Resumo do dia
                    </p>

                    <p className="text-lg font-black text-gray-900">
                      {selectedMember.name}
                    </p>

                    <p className="text-xs font-bold text-gray-400">
                      {selectedMember.status}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    Meta
                  </p>

                  <p className="text-lg font-black text-gray-900 mt-1">
                    {Math.round(safeNumber(selectedMember.goal))}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    Consumido
                  </p>

                  <p className="text-lg font-black text-gray-900 mt-1">
                    {Math.round(safeNumber(selectedMember.consumed))}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    Treino
                  </p>

                  <p className="text-lg font-black text-gray-900 mt-1">
                    {Math.round(safeNumber(selectedMember.burned))}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="w-full py-4 rounded-2xl bg-green-500 text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddMealScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const { userProfile, meals, setPendingMealType } = useApp();

  const mealCount = (userProfile?.mealCount || 4) as 3 | 4 | 5 | 6;
  const configs = MEAL_CONFIGS[mealCount] || MEAL_CONFIGS[4];

  const getMealIcon = (key: string) => {
    if (key === 'cafe') return '☕';
    if (key === 'almoco') return '🍽️';
    if (key === 'jantar') return '🌙';
    if (key === 'ceia') return '🌜';
    return '🍎';
  };

  const handleAdd = (mealKey: string) => {
    setPendingMealType(mealKey);
  };

  return (
    <div className="w-full max-w-md bg-gray-50 min-h-screen pb-32">
      <div className="bg-white pt-12 px-6 pb-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-30">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center active:scale-95 transition-all"
        >
          <X size={18} className="text-gray-500" />
        </button>

        <div>
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
            Registrar
          </p>

          <h1 className="text-xl font-black text-gray-900">
            Refeições do Dia
          </h1>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {configs.map((cfg) => {
          const registeredMeals = Array.isArray(meals)
            ? meals.filter((meal: any) => meal.type === cfg.key)
            : [];

          const totalCalories = registeredMeals.reduce(
            (sum: number, meal: any) =>
              sum + safeNumber(meal.cal || meal.calories),
            0
          );

          return (
            <div
              key={cfg.key}
              className="bg-white rounded-[30px] p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-xl shrink-0">
                    {getMealIcon(cfg.key)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900">
                      {cfg.label}
                    </p>

                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                      {registeredMeals.length > 0
                        ? `${registeredMeals.length} registro(s) · ${Math.round(totalCalories)} calorias`
                        : 'Ainda não registrado'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd(cfg.key)}
                  className="px-4 py-3 rounded-2xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                >
                  Adicionar
                </button>
              </div>

              {registeredMeals.length > 0 && (
                <div className="mt-4 space-y-2">
                  {registeredMeals.map((meal: any) => (
                    <div
                      key={meal.id}
                      className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-black text-gray-800">
                          {meal.items?.[0]?.food?.name || cfg.label}
                        </p>

                        <p className="text-[10px] font-bold text-gray-400 mt-1">
                          {Math.round(safeNumber(meal.cal || meal.calories))} calorias
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Navigation() {
  const { isLoggedIn, onboarded, completeScreening, setPendingEditMealId, setPendingMealType } = useApp();
  
  const [screen, setScreen] = useState<'hoje' | 'plano' | 'registrar' | 'circulo' | 'perfil' | 'lista'>('hoje');
  const [onboardingSub, setOnboardingSub] = useState<'welcome' | 'auth' | 'triagem'>('welcome');
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, [screen, onboardingSub, isLoggedIn, onboarded, tempProfile]);

  const navItems = [
    { icon: Sun, label: 'Hoje', key: 'hoje' },
    { icon: Book, label: 'Plano', key: 'plano' },
    { icon: Plus, label: 'Add', key: 'registrar', central: true },
    { icon: Users, label: 'Círculo', key: 'circulo' },
    { icon: User, label: 'Perfil', key: 'perfil' },
  ];

  // Logic for Quick Add
  const handleQuickAdd = (type: 'meal' | 'workout') => {
    setShowQuickAdd(false);
    if (type === 'meal') {
      setScreen('lista');
    } else {
      setShowWorkoutModal(true);
    }
  };

  if (!isLoggedIn) {
    if (onboardingSub === 'welcome') return <WelcomeScreen onNext={() => setOnboardingSub('auth')} />;
    return <AuthScreen onLogin={() => setOnboardingSub('triagem')} onSignup={() => setOnboardingSub('triagem')} />;
  }

  if (!onboarded) {
    if (!tempProfile) {
      return <TriagemScreen onComplete={(p) => setTempProfile(p)} />;
    }
    return <PlanBuilderScreen profile={tempProfile} onComplete={(final) => completeScreening(final)} />;
  }

  return (
        <div className="relative flex flex-col h-full min-h-0 overflow-hidden bg-gray-50">
        <main className="flex-1 min-h-0 overflow-y-auto w-full no-scrollbar scroll-smooth pb-20">
        {screen === 'hoje' && <HojeScreen onGoToList={() => setScreen('lista')} onNavigate={setScreen} />}
        {screen === 'lista' && (
          <RefeicoesListScreen 
            onBack={() => setScreen('hoje')} 
            onEdit={(id) => {
              setPendingEditMealId(id);
              setScreen('registrar');
            }}
            onAdd={(type) => {
              setPendingMealType(type);
              setScreen('registrar');
            }}
          />
        )}
        {screen === 'plano' && <PlanoScreen />}
        {screen === 'registrar' && <AddMealScreen onBack={() => setScreen('hoje')} />}
        {screen === 'circulo' && <CirculoScreenFoodstagram />}
        {screen === 'perfil' && <PerfilScreen />}
      </main>

      <RegisterWorkoutModal isOpen={showWorkoutModal} onClose={() => setShowWorkoutModal(false)} />

      <AnimatePresence>
       {showQuickAdd && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowQuickAdd(false)}
      className="absolute inset-0 bg-black/55 backdrop-blur-sm"
    />

    <motion.div
      initial={{ scale: 0.94, y: 16, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.94, y: 16, opacity: 0 }}
      className="bg-white w-full max-w-[340px] rounded-[32px] p-5 shadow-2xl relative z-10 text-gray-900"
    >
      <h3 className="text-lg font-black text-center mb-5">
        O que fazer agora?
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleQuickAdd('meal')}
          data-testid="quick-add-meal"
          className="bg-green-50 p-4 rounded-[24px] flex flex-col items-center gap-2.5 border border-green-100 active:scale-95 transition-all"
        >
          <div className="w-11 h-11 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100">
            <Utensils size={22} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight text-green-700 text-center leading-tight">
            Registrar refeição
          </span>
        </button>

        <button
          onClick={() => handleQuickAdd('workout')}
          data-testid="quick-add-workout"
          className="bg-orange-50 p-4 rounded-[24px] flex flex-col items-center gap-2.5 border border-orange-100 active:scale-95 transition-all"
        >
          <div className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
            <Dumbbell size={22} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight text-orange-700 text-center leading-tight">
            Registrar treino
          </span>
        </button>
      </div>

      <button
        onClick={() => setShowQuickAdd(false)}
        className="w-full py-3 bg-gray-100 text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest mt-4"
      >
        Fechar
      </button>
    </motion.div>
  </div>
)}
      </AnimatePresence>

      {/* Bottom Nav */}
      {screen !== 'registrar' && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex items-center justify-around px-2 z-50 rounded-t-[32px] shadow-2xl">
          {navItems.map((item) => (
            <button
              key={item.key}
              data-testid={item.central ? 'nav-add' : `nav-${item.key}`}
                onClick={() => item.central ? setShowQuickAdd(true) : setScreen(item.key as any)}
              className={`flex flex-col items-center gap-1.5 transition-all ${
                item.central ? 'mb-8' : ''
              } ${screen === item.key ? 'text-green-600' : 'text-gray-400'}`}
            >
              {item.central ? (
                <div className="bg-green-500 p-4 rounded-3xl shadow-xl shadow-green-200 border-4 border-white active:scale-90 transition-all">
                  <Plus size={28} className="text-white" />
                </div>
              ) : (
                <>
                  <item.icon size={22} className={screen === item.key ? 'stroke-[2.5px]' : 'stroke-2'} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function App() {
  return (
    <AppProvider>
      <MobileFrame>
        <Navigation />
      </MobileFrame>
    </AppProvider>
  );
}

export default App;
