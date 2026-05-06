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
} from './data/mealRules';
import { resolveFoodName } from './data/foodAliases';
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
    { title: 'Cuscuz com frango desfiado', items: ['Cuscuz de milho', 'Peito de Frango grelhado'] },
    { title: 'Tapioca com frango desfiado', items: ['Tapioca (goma)', 'Peito de Frango grelhado'] },
    { title: 'Pão com frango desfiado', items: ['Pão integral', 'Peito de Frango grelhado'] },
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

const isFoodRestricted = (foodName: string, userProfile: UserProfile | null) => {
  if (!userProfile) return false;
  const nameL = foodName.toLowerCase();
  const userRestrictions = userProfile.restrictions || [];
  const blockedFoods = userProfile.blockedFoods || [];
  const dietaryProfile = userProfile.dietaryProfile || 'sem_restricao';

  // 1. Blocked Foods (highest priority)
  if (blockedFoods.some(b => nameL === b.toLowerCase() || nameL.includes(b.toLowerCase()))) return true;

  // 2. Dietary Profile blocks
  if (dietaryProfile === 'vegetariano') {
    const meat = ['frango', 'carne', 'patinho', 'peixe', 'atum', 'tilápia', 'sobrecoxa', 'sardinha', 'frutos do mar', 'camarão'];
    if (meat.some(m => nameL.includes(m))) return true;
  } else if (dietaryProfile === 'vegano') {
    const animal = ['frango', 'carne', 'patinho', 'peixe', 'atum', 'tilápia', 'sobrecoxa', 'sardinha', 'frutos do mar', 'camarão', 'ovo', 'clara', 'leite', 'iogurte', 'queijo', 'requeijão', 'manteiga', 'whey', 'mel'];
    if (animal.some(a => nameL.includes(a))) return true;
  } else if (dietaryProfile === 'pescetariano') {
    const meat = ['frango', 'carne', 'patinho', 'sobrecoxa'];
    if (meat.some(m => nameL.includes(m))) return true;
  }

  // 3. Specific Allergies/Restrictions
  return userRestrictions.some(restriction => {
    const resKey = restriction.toLowerCase();
    const blockedTerms = RESTRICTION_MAPPING[resKey] || [resKey];
    return blockedTerms.some(term => nameL.includes(term));
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

  const updateProfile = (p: Partial<UserProfile>, forceRefresh = false) => {
    setUserProfile(prev => {
      const next = prev ? { ...prev, ...p } : null;
      if (next) {
        if (p.mealCount) setMealCount(next.mealCount);
      }
      return next;
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

  const getMealOptions = (targetCal: number, profile: UserProfile, mealKey: string) => {
    const isMainMeal = mealKey === 'almoco' || mealKey === 'jantar';
    const isSnack = mealKey.includes('lanche') || mealKey === 'ceia';
    const isBreakfast = mealKey === 'cafe';
    
    const templateKey = isBreakfast ? 'cafe' : isMainMeal ? (mealKey === 'jantar' ? 'jantar' : 'main') : 'snacks';
    let prefKey: 'breakfast' | 'main' | 'snacks' = 'snacks';
    if (isBreakfast) prefKey = 'breakfast';
    else if (isMainMeal) prefKey = 'main';

    const userPrefs = profile.preferredIngredients?.[prefKey] || [];
    let availableFoods = FOOD_DATABASE.filter(f => !isFoodRestricted(f.name, profile));
    if (availableFoods.length === 0) availableFoods = FOOD_DATABASE;

    const isDuplicateMealOption = (newOpt: any, existingOptions: any[]) => {
      const normTitle = newOpt.name.toLowerCase().trim();
      const normItems = newOpt.qty.toLowerCase();
      return existingOptions.some(old => {
        const oldTitle = old.name.toLowerCase().trim();
        const oldItems = old.qty.toLowerCase();
        if (normTitle === oldTitle) return true;
        const newComponents = normItems.split(' + ').map(s => s.replace(/\d+g|\d+ unidade[s]?|\d+ fatia[s]?/g, '').trim());
        const oldComponents = oldItems.split(' + ').map(s => s.replace(/\d+g|\d+ unidade[s]?|\d+ fatia[s]?/g, '').trim());
        const overlapCount = newComponents.filter(c => oldComponents.includes(c)).length;
        if (overlapCount >= 2 && newComponents.length === oldComponents.length) return true;
        return false;
      });
    };

    const generateOneOption = (index: number, existingResults: any[]) => {
      const recipes = RECIPE_LIBRARY[templateKey as keyof typeof RECIPE_LIBRARY] || [];
      const mealStyle = (profile.mealStyles?.[mealKey] || 'balanced') as 'balanced' | 'simple';
      
      let validRecipes = recipes.filter(r => {
        return r.items.every(itemName => {
          if (isFoodRestricted(itemName, profile)) return false;
          const matchingFoods = FOOD_DATABASE.filter(found => found.name === itemName || found.category === itemName || (itemName === 'Frutas' && found.category === 'Frutas'));
          if (matchingFoods.length > 0 && matchingFoods.every(f => isFoodRestricted(f.name, profile))) return false;
          return true;
        });
      });

      if (mealStyle === 'simple') {
        validRecipes = validRecipes.filter(r => r.items.length <= 2 || !r.items.some(it => it.toLowerCase().includes('carne')));
      }

      const pool = validRecipes.length > 0 ? validRecipes : recipes;
      let selectedRecipe = pool[Math.floor(Math.random() * pool.length)];
      
      const components: { name: string; display: string; cal: number; type?: string; order?: number; food?: any }[] = [];
      let totalCal = 0;
      let hasProtein = false;

      selectedRecipe.items.forEach((itemName) => {
        let options = availableFoods.filter(f => f.name === itemName || f.category === itemName || (itemName === 'Frutas' && f.category === 'Frutas'));
        if (options.length === 0) options = availableFoods.filter(f => f.tags?.includes(itemName.toLowerCase()) || f.category.toLowerCase().includes(itemName.toLowerCase()));

        let selected = options[0];
        if (options.length > 1) {
          const favs = options.filter(o => userPrefs.some(p => o.name.toLowerCase().includes(p.toLowerCase())));
          selected = favs.length > 0 ? favs[Math.floor(Math.random() * favs.length)] : options[Math.floor(Math.random() * options.length)];
        }

        if (!selected) return;
        const nameL = selected.name.toLowerCase();

        // Salada à vontade
        if (nameL.includes('salada verde')) {
          components.push({ name: selected.name, display: `${selected.name} à vontade`, cal: 10, type: 'vegetais', order: 10, food: selected });
          return;
        }

        let targetCompCal = targetCal / (selectedRecipe.items.filter(it => !it.toLowerCase().includes('salada verde')).length || 1);
        
        if (selected.category === 'Proteína Principal' || selected.category === 'Proteína Leve') {
          targetCompCal = targetCal * 0.45;
          hasProtein = true;
        } else if (selected.category === 'Carboidratos principais' || selected.name.includes('Pão') || selected.category === 'Carboidratos do café') {
          targetCompCal = targetCal * 0.35;
        }

        let qtyRaw = (targetCompCal / selected.cal) * 100;
        let qtyFinal = 0;
        const limits = MEAL_STRICT_LIMITS[selected.name];

        if (selected.un) {
          qtyFinal = Math.max(1, Math.round(qtyRaw / (selected.amountPerUn || 100)));
          if (limits && (limits.unit === 'unidade' || limits.unit === 'fatia')) qtyFinal = Math.min(qtyFinal, limits.max);
          const display = getDisplayUnit(qtyFinal, selected.un);
          const itemCal = (selected.cal * (qtyFinal * (selected.amountPerUn || 100) / 100));
          components.push({ name: selected.name, display: `${selected.name} ${display}`, cal: itemCal, food: selected });
          totalCal += itemCal;
        } else {
          qtyFinal = Math.max(10, Math.round(qtyRaw / 10) * 10);
          if (nameL.includes('legumes')) qtyFinal = Math.max(100, Math.min(250, Math.round(qtyRaw / 50) * 50));
          if (limits && (limits.unit === 'g' || limits.unit === 'gramas')) qtyFinal = Math.min(qtyFinal, limits.max);
          const display = formatQuantity(qtyFinal, 'g');
          const itemCal = (selected.cal * qtyFinal / 100);
          components.push({ name: selected.name, display: `${selected.name} ${display}`, cal: itemCal, food: selected, order: nameL.includes('legumes') ? 9 : undefined });
          totalCal += itemCal;
        }
      });

      // MANDATORY PROTEIN FOR MAIN MEALS
      if (isMainMeal && !hasProtein) {
        const protPool = availableFoods.filter(f => f.category === 'Proteína Principal' || f.category === 'Proteína Leve');
        const prot = protPool[Math.floor(Math.random() * protPool.length)];
        if (prot) {
          const qty = Math.max(100, Math.min(220, Math.round(((targetCal * 0.4) / prot.cal) * 100 / 10) * 10));
          components.push({ name: prot.name, display: `${prot.name} ${formatQuantity(qty, 'g')}`, cal: (prot.cal * qty / 100), food: prot, type: 'proteina', order: 3 });
          totalCal += (prot.cal * qty / 100);
        }
      }

      const sortedComponents = [...components].sort((a, b) => {
        if (a.order !== undefined || b.order !== undefined) return (a.order || 0) - (b.order || 0);
        const getOrder = (item: any) => {
          const n = item.name.toLowerCase();
          const cat = item.food?.category || '';
          if (isBreakfast || isSnack) {
            if (n.includes('pão') || n.includes('tapioca') || n.includes('iogurte')) return 1;
            if (cat === 'Proteína Leve' || n.includes('ovo')) return 2;
            if (cat === 'Gorduras') return 3;
            if (cat === 'Frutas') return 4;
            if (n.includes('café') || n.includes('leite')) return 5;
            return 6;
          } else if (isMainMeal) {
            if (cat === 'Carboidratos principais') return 1;
            if (cat === 'Leguminosa') return 2;
            if (cat === 'Proteína Principal' || cat === 'Proteína Leve') return 3;
            if (n.includes('legumes')) return 9;
            if (n.includes('salada')) return 10;
            return 11;
          }
          return 20;
        };
        return getOrder(a) - getOrder(b);
      });

      if (sortedComponents.length === 0 || totalCal < 50) return null;

      // BADGE LOGIC
      let badge = 'Completa';
      const proteinItem = sortedComponents.find(c => c.food?.category === 'Proteína Principal' || c.food?.category === 'Proteína Leve' || c.food?.name.toLowerCase().includes('ovo'));
      const proteinCal = proteinItem ? proteinItem.cal : 0;
      const proteinRatio = proteinCal / totalCal;

      if (mealStyle === 'simple') badge = 'Simples';
      else if (proteinRatio > 0.35) badge = 'Mais proteína';
      else if (proteinRatio < 0.15 && isMainMeal) badge = 'Menos proteína';
      else if (totalCal < targetCal * 0.85) badge = 'Leve';

      const opt = {
        name: selectedRecipe.title,
        qty: sortedComponents.map(c => c.display).join(' + '),
        cal: Math.round(totalCal),
        badge: badge,
        badgeDesc: '',
        proteinRatio
      };

      if (isDuplicateMealOption(opt, existingResults)) return null;
      return opt;
    };

    const results: any[] = [];
    for (let i = 0; i < 60; i++) { 
      const opt = generateOneOption(results.length, results);
      if (opt) {
        const calDiff = Math.abs(opt.cal - targetCal);
        // Scoring: Low cal diff + good protein ratio + completeness
        let score = 1000 - calDiff;
        if (opt.proteinRatio >= 0.25 && opt.proteinRatio <= 0.45) score += 100;
        if (isMainMeal && opt.qty.split(' + ').length >= 3) score += 50;
        if (opt.badge === 'Simples' && !isSnack) score -= 100;
        
        results.push({ ...opt, score });
      }
      if (results.length >= 3) break;
    }
    
    if (results.length === 0) results.push({ name: 'Refeição Básica', qty: 'Pão integral 2 fatias + Queijo minas 30g', cal: 250, badge: 'Simples', score: 0 });

    if (isBreakfast && userPrefs.some(p => p.toLowerCase().includes('café'))) {
      results.forEach((r, idx) => { if (!r.qty.toLowerCase().includes('café') && idx === 0) r.qty += ' + Café sem açúcar 1 xícara'; });
    }

    while (results.length < 3) results.push({ ...results[0], name: results[0].name + (results.length === 1 ? ' ' : '  '), score: -1000 });

    const sortedByScore = [...results].sort((a, b) => (b.score || 0) - (a.score || 0));
    return results.map(r => r === sortedByScore[0] ? { ...r, badge: 'Recomendada' } : r);
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
  qty: sanitizeOptionQtyText(opt.qty || ''),
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
  qty: sanitizeOptionQtyText(option.qty || ''),
}));

validatedPlan[mealKey] = ensureOneRecommended(sanitizedOptions).slice(0, 3);
  });

  return validatedPlan;
};

  const swapMealItem = (mealKey: string, index: number) => {
    if (!userProfile) return;
    const count = userProfile.mealCount;
    const configs = MEAL_CONFIGS[count];
    const cfg = configs.find(c => c.key === mealKey);
    if (!cfg) return;

    let targetCal = 0;
    if (count === 3) {
      if (cfg.key === 'cafe') targetCal = calorieGoal * 0.25;
      else if (cfg.key === 'almoco') targetCal = calorieGoal * 0.40;
      else if (cfg.key === 'jantar') targetCal = calorieGoal * 0.35;
    } else if (count === 4) {
      if (cfg.key === 'cafe') targetCal = calorieGoal * 0.25;
      else if (cfg.key === 'almoco') targetCal = calorieGoal * 0.35;
      else if (cfg.key === 'lanche') targetCal = calorieGoal * 0.15;
      else if (cfg.key === 'jantar') targetCal = calorieGoal * 0.25;
    } else if (count === 5) {
      if (cfg.key === 'cafe') targetCal = calorieGoal * 0.20;
      else if (cfg.key === 'lancheManha') targetCal = calorieGoal * 0.10;
      else if (cfg.key === 'almoco') targetCal = calorieGoal * 0.35;
      else if (cfg.key === 'lanche') targetCal = calorieGoal * 0.15;
      else if (cfg.key === 'jantar') targetCal = calorieGoal * 0.20;
    } else if (count === 6) {
      if (cfg.key === 'cafe') targetCal = calorieGoal * 0.18;
      else if (cfg.key === 'lancheManha') targetCal = calorieGoal * 0.10;
      else if (cfg.key === 'almoco') targetCal = calorieGoal * 0.30;
      else if (cfg.key === 'lanche') targetCal = calorieGoal * 0.12;
      else if (cfg.key === 'jantar') targetCal = calorieGoal * 0.22;
      else if (cfg.key === 'ceia') targetCal = calorieGoal * 0.08;
    }

    const options = getMealOptions(targetCal, userProfile, mealKey);
    const newPlan = { ...mealPlan };
    // Rotate options
    const currentName = newPlan[mealKey][index].name;
    const nextOption = options.find(o => o.name !== currentName) || options[0];
    newPlan[mealKey][index] = nextOption; 
    setMealPlan(newPlan);
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

function CalorieRing({ consumed, goal, size = 200, burned = 0 }: { consumed: number; goal: number; size?: number; burned?: number }) {
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const netBalance = consumed - burned;
  const progress = Math.min(safeNumber(consumed) / safeNumber(goal, 1), 1);
  const isOver = consumed > goal;
  
  // Progress stroke - Green for normal, Amber for overage
  const strokeDashoffset = circumference - progress * circumference;

  let statusText = "Dentro do planejado";
  let statusColor = "bg-[#005028]/35 text-white border-white/15";
  let ringColor = "#22C55E";

  if (isOver) {
    ringColor = "#F59E0B";
    if (netBalance <= goal) {
      statusText = "Excedido, mas o treino compensou";
      statusColor = "bg-orange-600/40 text-white border-white/10";
    } else {
      statusText = "Tudo bem, ajuste no próximo dia";
      statusColor = "bg-amber-600/40 text-white border-white/10";
    }
  } else if (consumed < goal * 0.7) {
    statusText = "Você ainda tem margem hoje";
    statusColor = "bg-[#005028]/35 text-white border-white/15";
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
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
      <div className="absolute flex flex-col items-center max-w-[160px] text-center">
        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Consumido</span>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black">{Math.round(safeNumber(consumed))}</span>
          <span className="text-sm font-bold opacity-60 uppercase">{consumed === 1 ? 'caloria' : 'calorias'}</span>
        </div>
        <div className={`mt-4 ${statusColor} backdrop-blur-md px-4 py-1.5 rounded-full border`}>
          <span className="text-[9px] font-black uppercase tracking-tighter block leading-tight">{statusText}</span>
        </div>
      </div>
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
                  className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-bold ${errorFields.includes('email') ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-green-500'}`} 
                  placeholder="seu@email.com" 
                />
             </div>
             <div className="space-y-1">
                <label className={`text-[10px] font-black uppercase ml-1 ${errorFields.includes('password') ? 'text-red-500' : 'text-gray-400'}`}>Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-bold ${errorFields.includes('password') ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:bg-white focus:ring-2 focus:ring-green-500'}`} 
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
  const totalSteps = 9;

  const [profile, setProfile] = useState<UserProfile>(userProfile || {
    name: '', age: 25, weight: 70, height: 170, gender: 'masculino',
    goal: 'perda', trainingsPerWeek: 3,
    mealCount: 4, dietaryProfile: 'sem_restricao', mainDifficulty: '', restrictions: [],
    preferredIngredients: { breakfast: [], main: [], snacks: [] }
  });

  useEffect(() => {
    scrollToTop();
  }, [step]);

  const next = () => {
    if (step < totalSteps) setStep(step + 1);
    else onComplete(profile);
  };

  const back = () => step > 1 && setStep(step - 1);

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Boas-vindas</p>
              <h2 className="text-4xl font-black text-gray-900 leading-tight">Como podemos te chamar?</h2>
            </div>
            <div className="space-y-2">
              <input 
                autoFocus
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full p-6 bg-gray-50 rounded-[32px] border-none focus:ring-2 focus:ring-green-500 font-black text-2xl placeholder:text-gray-200" 
                placeholder="Seu nome" 
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">Sua idade e sexo biológico</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Idade</label>
                <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: parseInt(e.target.value) || 0})} className="w-full p-6 bg-gray-50 rounded-[32px] font-black text-xl text-center" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Sexo</label>
                 <div className="flex bg-gray-50 p-1.5 rounded-[32px]">
                    {['masculino', 'feminino'].map(g => (
                      <button 
                        key={g}
                        onClick={() => setProfile({...profile, gender: g as any})}
                        className={`flex-1 py-4 rounded-[28px] text-[10px] font-black uppercase transition-all ${profile.gender === g ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}
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
            <h2 className="text-4xl font-black text-gray-900 leading-tight">Peso e Altura</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Peso (kg)</label>
                <input type="number" step="0.1" value={profile.weight} onChange={e => setProfile({...profile, weight: parseFloat(e.target.value) || 0})} className="w-full p-6 bg-gray-50 rounded-[32px] font-black text-xl text-center" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Altura (cm)</label>
                <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: parseInt(e.target.value) || 0})} className="w-full p-6 bg-gray-50 rounded-[32px] font-black text-xl text-center" />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">Perfil Alimentar</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { k: 'sem_restricao', l: 'Sem restrição', d: 'Como de tudo' },
                { k: 'vegetariano', l: 'Vegetariano', d: 'Sem carne (frango, carne, peixe)' },
                { k: 'vegano', l: 'Vegano', d: 'Sem nenhum item de origem animal' },
                { k: 'pescetariano', l: 'Pescetariano', d: 'Sem carne, mas como peixe' },
              ].map(opt => (
                <button 
                  key={opt.k}
                  onClick={() => setProfile({...profile, dietaryProfile: opt.k as any})}
                  className={`p-6 rounded-[32px] border-2 text-left transition-all ${profile.dietaryProfile === opt.k || (!profile.dietaryProfile && opt.k === 'sem_restricao') ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-transparent shadow-sm'}`}
                >
                  <p className="font-black text-gray-900 text-lg">{opt.l}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">{opt.d}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">Qual seu foco hoje?</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { k: 'perda', l: 'Emagrecer', d: 'Focar em queima de gordura' },
                { k: 'manutencao', l: 'Manter Peso', d: 'Saúde e definição' },
                { k: 'ganho', l: 'Ganhar Massa', d: 'Foco em músculos e força' },
              ].map(opt => (
                <button 
                  key={opt.k}
                  onClick={() => setProfile({...profile, goal: opt.k as any})}
                  className={`p-6 rounded-[32px] border-2 text-left transition-all ${profile.goal === opt.k ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-transparent shadow-sm'}`}
                >
                  <p className="font-black text-gray-900 text-lg">{opt.l}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">{opt.d}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">Frequência de treinos</h2>
            <div className="space-y-8 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sessões por semana</p>
              <div className="flex justify-center text-9xl font-black text-green-500">{profile.trainingsPerWeek}</div>
              <input 
                type="range" min="0" max="7" 
                value={profile.trainingsPerWeek} 
                onChange={e => setProfile({...profile, trainingsPerWeek: parseInt(e.target.value)})}
                className="w-full accent-green-500 h-2 bg-gray-100 rounded-full"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">Refeições por dia</h2>
            <div className="grid grid-cols-2 gap-3 mt-8">
              {[3, 4, 5, 6].map(n => (
                <button 
                  key={n}
                  onClick={() => setProfile({...profile, mealCount: n as any})}
                  className={`p-8 rounded-[38px] border-2 flex flex-col items-center justify-center transition-all ${profile.mealCount === n ? 'bg-green-50 border-green-500 text-green-600' : 'bg-gray-50 border-transparent text-gray-400'}`}
                >
                   <span className="text-3xl font-black">{n}</span>
                   <span className="text-[10px] font-bold uppercase mt-1">Refeições</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-gray-900 leading-tight">Sua maior dificuldade?</h2>
            <div className="grid grid-cols-1 gap-2">
              {['Falta de Tempo', 'Vontade de Doces', 'Fome Excessiva', 'Rotina Social', 'Não saber cozinhar', 'Organização das refeições'].map(diff => (
                <button 
                  key={diff}
                  onClick={() => setProfile({...profile, mainDifficulty: diff})}
                  className={`p-5 rounded-3xl border-2 text-left font-bold transition-all ${profile.mainDifficulty === diff ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-transparent text-gray-500'}`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Segurança</p>
              <h2 className="text-4xl font-black text-gray-900 leading-tight">Restrições ou Alergias?</h2>
            </div>
            <p className="text-xs text-gray-400 font-bold px-1 uppercase tracking-tight">Marque apenas o que você precisa evitar.</p>
            <div className="grid grid-cols-2 gap-3">
              {['Nenhuma', 'Lactose', 'Glúten', 'Amendoim', 'Castanhas/nozes', 'Ovo', 'Leite', 'Soja', 'Peixes', 'Crustáceos', 'Frutos do Mar', 'Gergelim', 'Corantes/aditivos', 'Outro'].map(res => (
                <button 
                  key={res}
                  onClick={() => {
                    let prev = [...profile.restrictions];
                    if (res === 'Nenhuma') {
                      prev = ['Nenhuma'];
                    } else {
                      prev = prev.filter(x => x !== 'Nenhuma');
                      if (prev.includes(res)) prev = prev.filter(x => x !== res);
                      else prev.push(res);
                    }
                    setProfile({...profile, restrictions: prev});
                  }}
                  className={`p-4 rounded-2xl border-2 text-center transition-all font-bold text-xs ${profile.restrictions.includes(res) ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-transparent text-gray-400 shadow-sm'}`}
                >
                  {res}
                </button>
              ))}
            </div>
            {profile.restrictions.includes('Outro') && (
              <input 
                autoFocus
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold text-sm mt-4"
                placeholder="Descreva outra restrição..."
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
       <div className="p-8 pt-12 flex items-center justify-between">
          <button 
            onClick={back} 
            className={`p-4 rounded-2xl transition-all ${step > 1 ? 'bg-gray-50' : 'opacity-0 pointer-events-none'}`}
          >
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
             <motion.div 
               key={step}
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: -20, opacity: 0 }}
               className="h-full"
             >
                {renderStep()}
             </motion.div>
          </AnimatePresence>
       </div>

       <div className="p-8 pb-12">
          <button 
            disabled={step === 1 && !profile.name}
            onClick={next}
            className={`w-full py-5 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
              (step === 1 && !profile.name) ? 'bg-gray-100 text-gray-300 shadow-none' : 'bg-green-500 text-white shadow-green-100'
            }`}
          >
            Próximo
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
    const restrictions = (data.restrictions || []).map(r => r.toLowerCase());
    const filteredOptions = options.filter(opt => !isFoodRestricted(opt, restrictions));

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
                 <h2 className="text-2xl font-black">Histórico</h2>
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
  const { userProfile, getTotals, calorieGoal, macros, mealCount, meals, workouts, addWorkout, deleteWorkout, estimateBurned, setPendingMealType, setPendingEditMealId, mealPlan, swapMealItem, selectedDate } = useApp();
  const totals = getTotals();
  const remaining = Math.max(safeNumber(calorieGoal) - safeNumber(totals.cal), 0);
  const burned = workouts.reduce((acc, w) => acc + safeNumber(w.burned), 0);
  const net = totals.cal - burned;
  
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateDisplay = isToday ? 'Hoje' : selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  const weekday = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' });

  const configs = MEAL_CONFIGS[mealCount];

  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-32">
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
      
      {/* Header */}
      <div className="bg-[#16A34A] pt-12 px-6 pb-16 rounded-b-[50px] text-white shadow-xl relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">{weekday}, {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
            <h1 className="text-2xl font-black mt-1">
              {isToday ? `Olá, ${userProfile?.name?.split(' ')[0] || 'Visitante'} 👋` : `Visualizando ${dateDisplay}`}
            </h1>
          </div>
          <button onClick={() => setShowHistory(true)} className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10 active:scale-95 transition-all">
            <Calendar size={18} />
          </button>
        </div>

        <div className="flex justify-center mb-8">
           <CalorieRing consumed={totals.cal} goal={calorieGoal} burned={burned} />
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-white/95 text-[#16A34A] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <Zap size={18} className="fill-current"/>
            <span className="text-sm font-black uppercase tracking-tight">Restante: {formatKcal(remaining)}</span>
          </div>
          
          {/* Daily Tip */}
          <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-start gap-3 w-full max-w-[320px]">
             <Sparkles size={16} className="mt-0.5 text-green-200" />
             <p className="text-xs text-white/90 font-medium leading-tight">
               <span className="font-black uppercase text-[8px] opacity-60 block tracking-widest mb-1">Dica do dia</span>
               {getDailyTip()}
             </p>
          </div>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="px-6 grid grid-cols-3 gap-3 -mt-4 relative z-20 font-sans">
         <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Meta</span>
            <span className="text-sm font-black text-gray-900">{calorieGoal}</span>
         </div>
         <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Treino</span>
            <span className="text-sm font-black text-green-500">+{burned}</span>
         </div>
         <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Bruto</span>
            <span className="text-sm font-black text-gray-900">{totals.cal}</span>
         </div>
      </div>

      <div className="px-6 mt-4 flex justify-center">
         <div className="bg-indigo-50/50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-2">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Saldo Líquido:</span>
            <span className="text-xs font-black text-indigo-600">{formatKcal(net)}</span>
         </div>
      </div>

      {/* Macros */}
      <div className="px-6 -mt-8 relative z-20">
         <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-50 grid grid-cols-3 gap-4">
            <div className="space-y-3">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Proteína</p>
               <ProgressBar val={totals.p} max={macros.p} color={C.protein} />
               <p className="text-[10px] font-black text-gray-900 text-center">{formatMacro(totals.p)} <span className="opacity-30 text-[8px]">/ {formatMacro(macros.p)}</span></p>
            </div>
            <div className="space-y-3">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Carbos</p>
               <ProgressBar val={totals.c} max={macros.c} color={C.carbs} />
               <p className="text-[10px] font-black text-gray-900 text-center">{formatMacro(totals.c)} <span className="opacity-30 text-[8px]">/ {formatMacro(macros.c)}</span></p>
            </div>
            <div className="space-y-3">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Gorduras</p>
               <ProgressBar val={totals.f} max={macros.f} color={C.fat} />
               <p className="text-[10px] font-black text-gray-900 text-center">{formatMacro(totals.f)} <span className="opacity-30 text-[8px]">/ {formatMacro(macros.f)}</span></p>
            </div>
         </div>
      </div>

      {/* Meals */}
      <div className="px-5 mt-10 space-y-5">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-xl font-black text-gray-900">Refeições</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Clique para registrar</p>
          </div>
          <button onClick={onGoToList} className="text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-xl transition-all active:scale-95">
            Ver tudo
          </button>
        </div>

        {configs.map(cfg => {
          const registeredMeals = meals.filter(m => m.type === cfg.key);
          const meal = registeredMeals[0];
          
          return meal ? (
            <div key={cfg.key} className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm transition-all">
              <div onClick={() => setExpandedMeal(expandedMeal === cfg.key ? null : cfg.key)} className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${cfg.color}15` }}>
                    <cfg.icon size={22} style={{ color: cfg.color }}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cfg.label}</p>
                    <p className="text-xs text-gray-500 font-semibold">{meal.time} · {meal.items.length} itens</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  {registeredMeals.length > 1 && (
                     <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">+{registeredMeals.length - 1}</span>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="font-black text-gray-900">{registeredMeals.reduce((a,b) => a+b.cal, 0)} <span className="text-[10px] uppercase opacity-40">calorias</span></span>
                  </div>
                  {expandedMeal === cfg.key ? <ChevronUp size={16} className="text-gray-300"/> : <ChevronDown size={16} className="text-gray-300"/>}
                </div>
              </div>
              <AnimatePresence>
                {expandedMeal === cfg.key && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-gray-50/50">
                    <div className="p-4 pt-0 border-t border-dashed border-gray-200">
                      <div className="mt-4 space-y-4">
                        {registeredMeals.map((rm, ridx) => (
                          <div key={rm.id} className={`${ridx > 0 ? 'pt-4 border-t border-gray-100' : ''}`}>
                             <div className="flex justify-between items-center mb-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registro {ridx + 1}</p>
                                <button onClick={() => { setPendingEditMealId(rm.id); onNavigate('registrar'); }} className="text-[10px] font-black text-green-600 uppercase">Editar</button>
                             </div>
                             <div className="space-y-2">
                                {rm.items.map((it, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <div>
                                      <p className="text-xs font-bold text-gray-800">{it.food.name}</p>
                                      <p className="text-[10px] text-gray-400 font-semibold">{it.qty}{it.unit === 'g' ? 'g' : (it.food.un || 'un')} · P:{it.p} C:{it.c} G:{it.f}</p>
                                    </div>
                                    <span className="text-[xs] font-bold text-gray-500">{it.cal} calorias</span>
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
            <div key={cfg.key} className="bg-white rounded-[28px] p-5 border border-dashed border-gray-200 shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${cfg.color}10` }}>
                    <cfg.icon size={22} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cfg.label}</p>
                    <p className="text-[10px] text-green-600 font-black uppercase mt-0.5">Plano</p>
                  </div>
               </div>
               
               <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-black text-gray-800 flex-1 pr-4">{mealPlan[cfg.key]?.[0]?.name || '---'}</p>
                    <span className="text-[10px] font-black text-green-600 whitespace-nowrap">{mealPlan[cfg.key]?.[0]?.cal || 0} calorias</span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => { setPendingMealType(cfg.key); onNavigate('registrar'); }}
                      className="w-full py-3 bg-[#16A34A] text-white rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-green-100 active:scale-95 transition-all text-center"
                    >
                      Registrar
                    </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* Workout */}
      <div className="px-5 mt-10">
        <div className="bg-[#FFFBEB] rounded-[32px] p-6 border border-orange-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 rounded-2xl">
                <Flame size={22} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Treino de Hoje</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Gasto estimado total</p>
              </div>
            </div>
            <button onClick={() => setShowWorkoutModal(true)} className="bg-orange-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all">
              Adicionar
            </button>
          </div>

          {workouts.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {workouts.map(w => (
                  <div key={w.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-orange-50">
                    <div>
                       <p className="text-sm font-black text-gray-800">{WORKOUT_TYPES.find(wt => wt.key === w.type)?.label}</p>
                       <p className="text-[10px] text-gray-500 font-bold uppercase">{w.duration > 0 ? `${w.duration} min` : 'Manual'} · {w.burned} calorias</p>
                    </div>
                    <button onClick={() => deleteWorkout(w.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                      <X size={16}/>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="bg-orange-500/10 rounded-2xl p-4 flex justify-between items-center border border-orange-100">
                 <p className="text-xs font-black text-orange-800 uppercase">Total gasto no treino</p>
                 <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-orange-600">{burned}</span>
                    <span className="text-[10px] font-bold text-orange-400 uppercase">calorias</span>
                 </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-orange-800/70 font-semibold leading-relaxed">
              Registre suas atividades para ver o gasto calórico acumulado hoje.
            </p>
          )}
        </div>
      </div>

      {/* Support Summary */}
      <div className="px-5 mt-8 mb-10">
        <button 
          onClick={() => onNavigate('circulo')}
          className="w-full bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden text-left group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Heart size={18} className="fill-white"/>
              </div>
              <h3 className="font-bold">Círculo de Apoio</h3>
            </div>
            <span className="text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-full border border-white/10">Abrir</span>
          </div>
          <p className="text-lg font-black leading-tight mb-2">Interaja com seu grupo 🚀</p>
        </button>
      </div>
      
      {/* Workout Modal */}
      <AnimatePresence>
        {showWorkoutModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowWorkoutModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-lg rounded-t-[44px] sm:rounded-[44px] shadow-2xl p-8 pt-12 z-10 max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
                <h2 className="text-3xl font-black text-gray-900 mb-2">Novo Exercício</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">Adicione um ou mais realizados hoje</p>
                
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

function PlanoScreen() {
  const { userProfile, mealPlan, generateNewPlan, swapMealItem, updateProfile, handleProfileUpdate } = useApp();
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [newPref, setNewPref] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleAddBlock = (val: string) => {
  if (!val.trim()) return;

  const resolvedName = resolveFoodName(val, FOODS);

  if (!resolvedName) {
    setSuggestion(`Alimento não encontrado: ${val.trim()}`);
    return;
  }

  if (resolvedName.toLowerCase() !== val.trim().toLowerCase()) {
    setSuggestion(resolvedName);
    return;
  }

  const current = userProfile.blockedFoods || [];

  if (!current.includes(resolvedName)) {
    handleProfileUpdate({ blockedFoods: [...current, resolvedName] });
  }

  setNewPref('');
  setSuggestion(null);
};

  const confirmBlock = (name: string) => {
  const resolvedName = resolveFoodName(name, FOODS) || name;
  const current = userProfile.blockedFoods || [];

  if (!current.includes(resolvedName)) {
    handleProfileUpdate({ blockedFoods: [...current, resolvedName] });
  }

  setNewPref('');
  setSuggestion(null);
};
  const [activeCategory, setActiveCategory] = useState<'breakfast' | 'main' | 'snacks'>('breakfast');

  if (!userProfile) return null;

  const count = userProfile.mealCount;
  const configs = MEAL_CONFIGS[count];

  const handleAddPref = () => {
  if (!newPref.trim()) return;

  const resolvedName = resolveFoodName(newPref, FOODS);

  if (!resolvedName) {
    setSuggestion(`Alimento não encontrado: ${newPref.trim()}`);
    return;
  }

  const current = userProfile.preferredIngredients[activeCategory] || [];

  if (!current.includes(resolvedName)) {
    const updatedPrefs = { ...userProfile.preferredIngredients };
    updatedPrefs[activeCategory] = [...current, resolvedName];
    handleProfileUpdate({ preferredIngredients: updatedPrefs });
  }

  setNewPref('');
  setSuggestion(null);
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
    <div className="w-full max-w-md bg-gray-50 min-h-screen pb-32">
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
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Meus Objetivos</p>
            <h2 className="text-2xl font-black text-gray-900 border-l-4 border-green-500 pl-3 leading-none mt-1">Plano Alimentar</h2>
          </div>
          <button 
            onClick={() => setShowAdjustModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all"
          >
            <Sliders size={14} />
            Ajustar
          </button>
       </div>

       <div className="px-6 py-8 space-y-12">
          {configs.map(cfg => (
            <div key={cfg.key} className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50">
                    <cfg.icon size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 leading-none">{cfg.label}</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{mealPlan[cfg.key]?.length || 0} opções geradas</p>
                  </div>
               </div>

               <div className="space-y-4">
                  {(mealPlan[cfg.key] || []).map((opt: any, i: number) => (
                    <div 
                      key={i} 
                      className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-100/50 border border-gray-50 flex justify-between items-center group relative overflow-hidden transition-all hover:shadow-green-100/50"
                    >
                       <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-2">
                             {/* Single Badge Strategy */}
                             {opt.badge === 'Recomendada' && <span className="bg-green-500 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-md">Recomendada</span>}
                             {opt.badge === 'Simples' && <span className="bg-amber-100 text-amber-700 text-[7px] font-black uppercase px-2 py-0.5 rounded-md">Simples</span>}
                             {opt.badge === 'Leve' && <span className="bg-cyan-50 text-cyan-500 text-[7px] font-black uppercase px-2 py-0.5 rounded-md">Leve</span>}
                             {opt.badge === 'Menos proteína' && <span className="bg-[#FEF3C7] text-[#92400E] text-[7px] font-black uppercase px-2 py-0.5 rounded-md">Menos proteína</span>}
                             {/* Fallback */}
                             {!opt.badge && i === 0 && <span className="bg-green-500 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-md">Recomendada</span>}
                          </div>
                          
                          <h4 className="text-sm font-black text-gray-900 mb-2 leading-tight uppercase tracking-tight">{opt.name}</h4>
                          
                          <div className="flex flex-col gap-1.5 mb-4">
                             {opt.qty.split(' + ').map((q: string, idx: number) => (
                               <div key={idx} className="flex items-center gap-1.5 opacity-60">
                                 <div className="w-1 h-1 bg-green-500 rounded-full" />
                                 <span className="text-[10px] font-bold text-gray-500">{q}</span>
                               </div>
                             ))}
                          </div>

                          <button 
                            onClick={() => swapMealItem(cfg.key, i)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-xl text-[9px] font-black uppercase transition-all active:scale-95"
                          >
                             <Shuffle size={12} />
                             Sugestão Alternativa
                          </button>
                       </div>
                       
                       <div className="text-right flex flex-col items-end pl-4 border-l border-gray-50">
                          <p className="text-2xl font-black text-gray-900 leading-none">{Math.round(safeNumber(opt.cal))}</p>
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-tighter mt-1">calorias</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          ))}

          {/* Tips Section */}
          <div className="bg-green-600 rounded-[38px] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
             <Star className="text-green-300 mb-4" size={24} />
             <h3 className="text-xl font-black mb-2 leading-tight">Dica de Sucesso</h3>
             <p className="text-green-50 text-sm font-medium leading-relaxed opacity-90">
                {userProfile.goal === 'perda' ? "Priorize as proteínas e os vegetais para manter a saciedade por mais tempo." : "Tente não pular refeições para garantir o aporte calórico necessário."}
             </p>
          </div>
       </div>

       <AnimatePresence>
         {showAdjustModal && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/60 shadow-inner backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
           >
             <motion.div 
               initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
               className="bg-white w-full max-w-lg rounded-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl no-scrollbar"
             >
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black text-gray-900 border-l-4 border-green-500 pl-4 uppercase tracking-tighter">Ajustar Plano</h2>
                   <button onClick={() => setShowAdjustModal(false)} className="p-3 bg-gray-100 rounded-2xl active:scale-90 transition-all text-gray-400">
                      <X size={20}/>
                   </button>
                </div>

                <div className="space-y-8 text-left">
                   {/* Perfil Alimentar */}
                   <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">Perfil Alimentar</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { id: 'sem_restricao', label: 'Sem Restrição' },
                          { id: 'vegetariano', label: 'Vegetariano' },
                          { id: 'vegano', label: 'Vegano' },
                          { id: 'pescetariano', label: 'Pescetariano' }
                        ] as const).map(p => (
                          <button 
                            key={p.id}
                            onClick={() => handleProfileUpdate({ dietaryProfile: p.id })}
                            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${userProfile.dietaryProfile === p.id || (!userProfile.dietaryProfile && p.id === 'sem_restricao') ? 'bg-green-50 border-green-500 text-green-600 shadow-sm' : 'bg-white border-transparent text-gray-400'}`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">Restrições (Alergias)</p>
                      <div className="flex flex-wrap gap-2">
                         {['Lactose', 'Glúten', 'Ovo', 'Peixes', 'Amendoim'].map(r => (
                           <button 
                             key={r}
                             onClick={() => handleRestrictionToggle(r)}
                             className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${userProfile.restrictions.includes(r.toLowerCase()) ? 'bg-red-50 border-red-500 text-red-600 shadow-sm' : 'bg-white border-transparent text-gray-400'}`}
                           >
                             Sem {r}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">Estilo das Refeições</p>
                      <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-4">
                         {configs.map(m => (
                           <div key={m.key} className="flex flex-col gap-2">
                              <p className="text-[10px] font-black text-gray-500 uppercase">{m.label}</p>
                              <div className="flex bg-white p-1 rounded-xl shadow-sm">
                                 {([
                                   { id: 'balanced', label: 'Completa' },
                                   { id: 'simple', label: 'Simples' }
                                 ] as const).map(style => (
                                   <button
                                     key={style.id}
                                     onClick={() => {
                                       const styles = { ...(userProfile.mealStyles || {}) };
                                       styles[m.key] = style.id;
                                       handleProfileUpdate({ mealStyles: styles });
                                     }}
                                     className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all whitespace-nowrap flex-1 ${userProfile.mealStyles?.[m.key] === style.id || (!userProfile.mealStyles?.[m.key] && style.id === 'balanced') ? 'bg-green-500 text-white shadow-md' : 'text-gray-300'}`}
                                   >
                                     {style.label}
                                   </button>
                                 ))}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div>
                      <div className="flex justify-between items-center mb-4 px-1">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Não quero no plano</p>
                        <span className="text-[8px] font-bold text-gray-300 uppercase">Bloqueados</span>
                      </div>
                      <div className="relative">
                          <div className="flex gap-3 mb-2 bg-gray-50 rounded-2xl p-2 border border-gray-100">
                             <input 
                               value={newPref}
                               onChange={e => { setNewPref(e.target.value); setSuggestion(null); }}
                               onKeyDown={e => e.key === 'Enter' && handleAddBlock(newPref)}
                               placeholder="Ex: Coentro, Berinjela..."
                               className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 placeholder:text-gray-300"
                             />
                             <button onClick={() => handleAddBlock(newPref)} className="p-3 bg-red-500 text-white rounded-xl active:scale-95 transition-all">
                                <Plus size={20}/>
                             </button>
                          </div>
                          
                          <AnimatePresence>
                             {suggestion && (
                               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl mt-1">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Você quis dizer <span className="text-gray-900 border-b-2 border-red-200">{suggestion}</span>?</p>
                                  <div className="flex gap-2">
                                     <button onClick={() => confirmBlock(suggestion)} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-100 transition-all active:scale-95">Sim, bloquear</button>
                                     <button onClick={() => confirmBlock(newPref)} className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95">Não, {newPref}</button>
                                  </div>
                                  <button onClick={() => setSuggestion(null)} className="w-full mt-3 text-[8px] font-bold text-gray-300 uppercase">Cancelar</button>
                               </motion.div>
                             )}
                             {!suggestion && newPref.length > 2 && !findFuzzyMatch(newPref) && (
                               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute z-50 w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl mt-1">
                                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Alimento não encontrado</p>
                                  <p className="text-[9px] text-gray-400 font-bold mb-4">Deseja bloquear "{newPref}" mesmo assim?</p>
                                  <div className="flex gap-2">
                                     <button onClick={() => confirmBlock(newPref)} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all">Confirmar</button>
                                     <button onClick={() => setNewPref('')} className="flex-1 bg-white text-gray-300 py-3 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all border border-gray-100">Limpar</button>
                                  </div>
                               </motion.div>
                             )}
                          </AnimatePresence>
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
                              <button onClick={() => handleProfileUpdate({ blockedFoods: (userProfile.blockedFoods || []).filter(i => i !== item) })} className="p-1">
                                 <X size={12} />
                              </button>
                           </motion.div>
                         ))}
                      </div>
                   </div>

                   <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">Seus Favoritos ({activeCategory === 'breakfast' ? 'Café' : activeCategory === 'main' ? 'Pratos' : 'Lanches'})</p>
                      <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-5">
                         {(['breakfast', 'main', 'snacks'] as const).map(cat => (
                           <button
                             key={cat}
                             onClick={() => setActiveCategory(cat)}
                             className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeCategory === cat ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
                           >
                             {cat === 'breakfast' ? 'Café' : cat === 'main' ? 'Pratos' : 'Lanches'}
                           </button>
                         ))}
                      </div>

                      <div className="flex gap-3 mb-4 bg-gray-50 rounded-2xl p-2 border border-gray-100">
                         <input 
                           value={newPref}
                           onChange={e => setNewPref(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleAddPref()}
                           placeholder="Buscar favorito..."
                           className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 placeholder:text-gray-300"
                         />
                         <button onClick={handleAddPref} className="p-3 bg-green-500 text-white rounded-xl active:scale-95 transition-all">
                            <Plus size={20}/>
                         </button>
                      </div>

                      <div className="flex flex-wrap gap-2 min-h-[60px]">
                         {(userProfile.preferredIngredients[activeCategory] || []).map(item => (
                           <motion.div 
                             initial={{ scale: 0.8, opacity: 0 }} 
                             animate={{ scale: 1, opacity: 1 }}
                             key={item} 
                             className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-green-100"
                           >
                              <span>{item}</span>
                              <button onClick={() => handleRemovePref(item)} className="p-1">
                                 <X size={12} />
                              </button>
                           </motion.div>
                         ))}
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => { generateNewPlan(); setShowAdjustModal(false); triggerToast(); }}
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
  const { meals: myMeals, getTotals: getMyTotals, calorieGoal: myGoal, workouts: myWorkouts } = useApp();
  const isMe = member.id === 'me';
  const totals = isMe ? getMyTotals() : { cal: member.consumed, p: 0, c: 0, f: 0 };
  const goal = isMe ? myGoal : 1800 + (member.consumed % 500); 
  const workouts = isMe ? myWorkouts : (member.workouts || []);
  const burned = isMe ? workouts.reduce((acc, w) => acc + safeNumber(w.burned), 0) : workouts.reduce((acc: number, w: any) => acc + safeNumber(w.burned), 0) || (member.trained ? 350 : 0);
  const progress = Math.min((totals.cal / (goal + burned)) * 100, 100);

  const meals = isMe ? myMeals : [
    { type: 'Café da Manhã', desc: 'Pão integral com ovos', cal: 320, time: '08:15' },
    { type: 'Almoço', desc: 'Arroz, feijão preto e frango', cal: 559, time: '12:30' },
    { type: 'Lanche', desc: 'Iogurte com granola', cal: 361, time: '16:00' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-gray-900">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto no-scrollbar relative">
        <div className="sticky top-0 bg-white pb-6 z-10 flex justify-between items-center border-b border-gray-50 mb-6 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-500 text-xl shadow-sm overflow-hidden">
              {member.imgUrl ? (
                <img src={member.imgUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                member.img
              )}
            </div>
            <div>
              <h2 className="text-xl font-black">{member.name} {isMe && "(Você)"}</h2>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{member.status || 'Ativo agora'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"><X size={18}/></button>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-5 rounded-[28px] border border-gray-50">
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Calorias</p>
               <p className="text-2xl font-black text-gray-900">{Math.round(totals.cal)}</p>
               <p className="text-[8px] font-bold text-gray-400">consumidas</p>
            </div>
            <div className="bg-indigo-50/50 p-5 rounded-[28px] border border-indigo-50">
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Restante</p>
               <p className="text-2xl font-black text-indigo-600">{Math.round(Math.max(0, goal + burned - totals.cal))}</p>
               <p className="text-[8px] font-bold text-indigo-400">para a meta</p>
            </div>
          </div>

          <div className="px-2">
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
               <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase text-center">{Math.round(progress)}% da meta atingida</p>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Treinos de hoje</p>
            <div className="space-y-3">
              {(workouts.length > 0 || (member.trained && !isMe)) ? (
                <>
                  <div className="space-y-2">
                    {workouts.length > 0 ? workouts.map((w: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center">
                              <Dumbbell size={16} />
                           </div>
                           <div>
                              <p className="text-xs font-black text-gray-800 uppercase tracking-tighter">{w.type === 'musculacao' ? 'Musculação' : (WORKOUT_TYPES.find(wt => wt.key === w.type)?.label || w.type)}</p>
                              <p className="text-[10px] font-bold text-gray-400">{w.duration} min</p>
                           </div>
                        </div>
                        <p className="text-[10px] font-black text-orange-600">{w.burned} calorias</p>
                      </div>
                    )) : (
                      <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center">
                              <Dumbbell size={16} />
                           </div>
                           <div>
                              <p className="text-xs font-black text-gray-800 uppercase tracking-tighter">Musculação</p>
                              <p className="text-[10px] font-bold text-gray-400">45 min</p>
                           </div>
                        </div>
                        <p className="text-[10px] font-black text-orange-600">350 calorias</p>
                      </div>
                    )}
                  </div>
                  {workouts.length >= 1 && (
                    <div className="pt-2 px-2 flex justify-end">
                       <p className="text-[9px] font-black text-orange-500/60 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Total no treino: {burned} calorias</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Nenhum treino registrado hoje.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Refeições de Hoje</p>
            <div className="space-y-3">
              {meals.length > 0 ? (meals as any[]).map((m: any, i: number) => (
                <div key={i} className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex justify-between items-center group">
                  <div>
                    <p className="text-xs font-black text-gray-800 uppercase tracking-tighter">{m.type === 'CAFE' || m.type === 'Café da Manhã' ? 'Café da manhã' : (m.type === 'ALMOCO' ? 'Almoço' : (m.type === 'JANTAR' ? 'Jantar' : (m.type === 'LANCHE' ? 'Lanche da tarde' : m.type)))}</p>
                    <p className="text-[10px] font-bold text-gray-400 italic line-clamp-1">{isMe ? m.items.map((it:any) => it.food.name).join(', ') : m.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-indigo-600">{m.cal} calorias</p>
                    <p className="text-[8px] font-bold text-gray-300">{m.time}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Nenhuma refeição registrada hoje.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-900 rounded-[40px] p-8 text-white text-center shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <Rocket size={32} className="mx-auto mb-4 text-indigo-300 relative z-10"/>
            <h4 className="text-xl font-black mb-2 relative z-10">Incentive agora!</h4>
            <p className="text-[10px] font-bold text-indigo-200 mb-8 opacity-80 uppercase tracking-widest relative z-10">Mande um apoio rápido para {member.name.split(' ')[0]}</p>
            <div className="flex flex-wrap gap-2 justify-center relative z-10">
               {["Boa!", "Bora!", "Top!", "No foco!"].map(msg => (
                 <button key={msg} onClick={() => onClose()} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 border border-white/5">{msg}</button>
               ))}
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
        remaining: Math.round(Math.max(0, calorieGoal + burned - totals.cal)), 
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
    const myShared = meals.filter(m => m.shared).map(m => ({
      id: m.id,
      userName: userProfile?.name || 'Você',
      type: m.type,
      desc: m.items.map(it => it.food.name).join(', '),
      cal: m.cal,
      time: m.time,
      photo: m.photo,
      isMessage: false
    }));

    const mockShared = activeCircle === 'Thiago & Partners' ? [
      { id: 'm1', userName: 'Partner ❤️', type: 'almoco', desc: 'Arroz, feijão preto e frango', cal: 559, time: '12:30', photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200', isMessage: false },
      { id: 'm2', userName: 'Lucas Silva', type: 'lanche', desc: 'Whey Protein com aveia', cal: 320, time: '16:45', photo: null, isMessage: false },
    ] : activeCircle === 'Família' ? [
      { id: 'm3', userName: 'Mãe', type: 'cafe', desc: 'Frutas com iogurte', cal: 210, time: '07:45', photo: null, isMessage: false },
    ] : [];

    const messages = supportFeed.map(s => ({
      id: s.id,
      userName: s.user,
      type: 'message',
      desc: s.msg,
      cal: 0,
      time: s.time,
      photo: null,
      isMessage: true
    }));

    return [...messages, ...myShared, ...mockShared].sort((a, b) => b.id.localeCompare(a.id));
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
    <div className="w-full max-w-md bg-gray-50 min-h-screen pb-32">
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
             <h3 className="font-black text-gray-900 border-l-4 border-indigo-500 pl-4 uppercase text-[10px] mb-8 tracking-widest">Membros do Círculo</h3>
             <div className="flex flex-col gap-4">
                {membersData.map((m: any) => (
                   <div key={m.id} className="bg-gray-50/50 rounded-[32px] p-6 border border-gray-100 flex flex-col group active:bg-gray-100 transition-all">
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
                      
                      <div className="h-1.5 bg-gray-200/50 rounded-full overflow-hidden mb-4">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (m.consumed / (m.consumed + m.remaining)) * 100)}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                         <div className="bg-white/60 p-3 rounded-2xl border border-gray-50">
                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter mb-1">Hoje</p>
                            <p className="text-xs font-black text-indigo-600">{Math.round(m.consumed)} cal</p>
                         </div>
                         <div className="bg-white/60 p-3 rounded-2xl border border-gray-50">
                            <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter mb-1">Restante</p>
                            <p className="text-xs font-black text-orange-500">{Math.round(m.remaining)} cal</p>
                         </div>
                      </div>

                      <button 
                         onClick={() => setShowMemberModal(m)} 
                         className="w-full py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                      >
                         Ver dia
                      </button>
                   </div>
                ))}
             </div>
          </div>


          {/* Activity Feed */}
          <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-gray-50">
             <h3 className="font-black text-gray-900 border-l-4 border-indigo-500 pl-4 uppercase text-[10px] mb-8 tracking-widest text-center">Atividade Recente</h3>
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

                          {item.photo && (
                             <div className="w-full aspect-[4/3] rounded-[40px] overflow-hidden bg-gray-100 my-4 shadow-xl border border-gray-100 group relative">
                                <img src={item.photo} alt="Refeição" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                          )}

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
                    <button key={n} onClick={() => setCount(n as any)} className={`py-3 rounded-xl font-black text-xs ${count === n ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
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
                      <button key={n} onClick={() => setProfile({...profile, trainingsPerWeek: n})} className={`py-3 rounded-xl font-black text-[10px] ${profile.trainingsPerWeek === n ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
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
  const { calorieGoal, macros, userProfile, logout, resetApp, fillDemo, getTotals, remaining, myCheckin, setMyCheckin } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const totals = getTotals();
  const progress = Math.min((totals.cal / calorieGoal) * 100, 100);
  
  return (
    <div className="w-full max-w-md bg-gray-50 min-h-screen pb-32">
       <div className="bg-[#16A34A] pt-12 px-6 pb-12 rounded-b-[40px] text-white text-center relative shadow-lg">
          <div className="absolute top-4 right-6">
             <button onClick={() => setShowInfo(true)} className="p-2 bg-white/20 rounded-[14px] active:scale-90 transition-all">
               <Info size={16}/>
             </button>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-[28px] mx-auto mb-3 border-2 border-white/30 flex items-center justify-center p-0.5 overflow-hidden">
             <div className="w-full h-full bg-white rounded-[24px] flex items-center justify-center overflow-hidden">
                {userProfile?.profilePicture ? (
                  <img src={userProfile.profilePicture} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-[#16A34A] text-xl">{userProfile?.name?.[0] || 'T'}</span>
                )}
             </div>
          </div>
          <h1 className="text-lg font-black">{userProfile?.name || 'Usuário FitCircle'}</h1>
          <p className="text-[9px] font-bold opacity-70 mt-0.5 uppercase tracking-widest">
            Objetivo: {userProfile?.goal === 'perda' ? 'Perda de Peso' : userProfile?.goal === 'ganho' ? 'Ganho de Massa' : userProfile?.goal === 'manutencao' ? 'Manutenção' : 'Recomposição'} 🔥
          </p>
          
          <div className="flex justify-center gap-2 mt-4">
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-white text-green-600 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
               Editar Perfil
            </button>
            <button onClick={fillDemo} className="bg-green-600 border border-white/30 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
               Usar Demo
            </button>
          </div>
       </div>

       <div className="px-5 mt-6 gap-6 flex flex-col mb-10">
          <div className="grid grid-cols-2 gap-4">
             {[
               { l: 'Peso Atual', v: `${userProfile?.weight || 0} kg`, c: 'bg-white' },
               { l: 'Altura', v: `${userProfile?.height || 0} cm`, c: 'bg-white' },
               { 
                 l: 'IMC', 
                 v: userProfile ? (userProfile.weight / (Math.pow(userProfile.height/100, 2))).toFixed(1) : '0', 
                 c: 'bg-white col-span-2 py-4',
                 extra: (() => {
                    if (!userProfile) return null;
                    const bmi = userProfile.weight / (Math.pow(userProfile.height/100, 2));
                    let label = "";
                    let color = "";
                    let pos = 0;
                    if (bmi < 18.5) { label = "Abaixo do peso"; color = "text-blue-400"; pos = 10; }
                    else if (bmi < 25) { label = "Faixa saudável"; color = "text-green-500"; pos = 40; }
                    else if (bmi < 30) { label = "Sobrepeso"; color = "text-amber-500"; pos = 65; }
                    else if (bmi < 35) { label = "Obesidade I"; color = "text-orange-500"; pos = 80; }
                    else { label = "Obesidade II+"; color = "text-red-500"; pos = 95; }
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-50 w-full">
                        <p className={`text-[8px] font-black uppercase ${color} mb-2 tracking-tighter`}>{label}</p>
                        <div className="h-1.5 bg-gray-100 rounded-full relative overflow-visible mx-1">
                          <div className="absolute inset-y-0 left-[18%] right-[55%] bg-green-100 rounded-full" />
                          <motion.div initial={{ left: 0 }} animate={{ left: `${pos}%` }} className={`absolute -top-1 w-3.5 h-3.5 ${color.replace('text', 'bg')} border-2 border-white rounded-full shadow-sm`} />
                        </div>
                      </div>
                    );
                 })()
               },
               { l: 'Meta de calorias', v: `${calorieGoal}`, c: 'bg-green-50 text-green-600 border-green-100' },
             ].map(s => (
               <div key={s.l} className={`${s.c} rounded-[32px] p-6 shadow-xl shadow-gray-100 border border-gray-50 text-center flex flex-col justify-center items-center min-h-[120px]`}>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{s.l}</p>
                    <p className="text-xl font-black">{s.v}</p>
                  </div>
                  {(s as any).extra}
               </div>
             ))}
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-50">
             <h3 className="font-black text-gray-900 border-l-4 border-green-500 pl-3 uppercase text-xs tracking-tighter mb-6">Divisão de Macros</h3>
             <div className="space-y-4">
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>Proteínas</span>
                      <span className="text-blue-500">{macros.p}g</span>
                   </div>
                   <ProgressBar val={macros.p} max={macros.p} color={C.protein} />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>Carboidratos</span>
                      <span className="text-green-500">{macros.c}g</span>
                   </div>
                   <ProgressBar val={macros.c} max={macros.c} color={C.carbs} />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>Gorduras</span>
                      <span className="text-orange-500">{macros.f}g</span>
                   </div>
                   <ProgressBar val={macros.f} max={macros.f} color={C.fat} />
                </div>
             </div>
          </div>

          <button 
            onClick={() => setShowResetConfirm(true)}
            className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-50 flex items-center justify-between group overflow-hidden active:bg-red-50 transition-colors"
          >
             <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-2xl flex items-center justify-center">
                   <Rocket size={20} className="text-red-500 rotate-180"/>
                </div>
                <span className="font-black text-red-500 text-sm uppercase tracking-tight">Resetar App / Limpar Dados</span>
             </div>
             <ChevronUp size={20} className="text-gray-200 rotate-90"/>
          </button>

          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-50 flex items-center justify-between group overflow-hidden active:bg-gray-100 transition-colors"
          >
             <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-center">
                   <X size={20} className="text-gray-500"/>
                </div>
                <span className="font-black text-gray-800 text-sm uppercase tracking-tight">Sair da Conta</span>
             </div>
             <ChevronUp size={20} className="text-gray-200 rotate-90"/>
          </button>

          {!((window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone) && (
            <div className="bg-green-50 rounded-[32px] p-6 border border-green-100 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500 rounded-xl">
                  <Smartphone className="text-white" size={20} />
                </div>
                <h3 className="font-black text-green-700 text-sm uppercase tracking-tight">Instalar FitCircle</h3>
              </div>
              <p className="text-[10px] font-bold text-green-600/80 leading-relaxed space-y-2">
                <span className="block">• No iPhone: Toque em <Share size={12} className="inline mx-1" /> Compartilhar e depois "Adicionar à Tela de Início".</span>
                <span className="block mt-2">• No Android: Toque nos três pontos do navegador e selecione "Instalar App".</span>
              </p>
            </div>
          )}
       </div>

       <EditProfileModal isOpen={isEditing} onClose={() => setIsEditing(false)} />

       <AnimatePresence>
          {showInfo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInfo(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 text-gray-900 text-left">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-500">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">Privacidade e Dados</h3>
                <div className="space-y-4 text-sm text-gray-500 font-medium leading-relaxed">
                  <p>Seus dados são usados exclusivamente para calcular suas metas nutricionais e personalizar seu plano alimentar.</p>
                  <p>Nenhuma informação pessoal é compartilhada com terceiros sem seu consentimento explícito.</p>
                  <p>Você pode excluir sua conta e todos os dados associados a qualquer momento nas configurações.</p>
                </div>
                <button onClick={() => setShowInfo(false)} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl mt-8 text-[10px] uppercase tracking-widest active:scale-95 transition-all">Entendido</button>
              </motion.div>
            </div>
          )}
       </AnimatePresence>

       <AnimatePresence>
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogoutConfirm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-[40px] w-full max-w-sm relative z-10 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                     <User size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Deseja sair?</h3>
                  <p className="text-gray-400 font-medium text-sm mb-8 leading-relaxed">Você voltará para a tela de login. Seus dados serão mantidos.</p>
                  <div className="flex flex-col gap-3">
                     <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="w-full py-4 bg-gray-900 text-white font-black rounded-3xl uppercase text-xs tracking-widest transition-all active:scale-95">Sim, Sair</button>
                     <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 bg-gray-50 text-gray-400 font-black rounded-3xl uppercase text-xs tracking-widest transition-all active:scale-95">Cancelar</button>
                  </div>
               </motion.div>
            </div>
          )}

          {showResetConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 text-center">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResetConfirm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-[40px] w-full max-w-sm relative z-10">
                  <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                     <Rocket size={32} className="text-red-500 rotate-180" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Limpar dados?</h3>
                  <p className="text-gray-400 font-medium text-sm mb-8 leading-relaxed">Tem certeza que deseja limpar os dados desta conta? Isso apagará perfil, treinos e refeições permanentemente.</p>
                  <div className="flex flex-col gap-3">
                     <button onClick={() => { setShowResetConfirm(false); resetApp(); }} className="w-full py-4 bg-red-500 text-white font-black rounded-3xl uppercase text-xs tracking-widest shadow-xl shadow-red-100 transition-all active:scale-95">Limpar dados</button>
                     <button onClick={() => setShowResetConfirm(false)} className="w-full py-4 bg-gray-50 text-gray-400 font-black rounded-3xl uppercase text-xs tracking-widest transition-all active:scale-95">Cancelar</button>
                  </div>
               </motion.div>
            </div>
          )}
       </AnimatePresence>
    </div>
  );
}
function RefeicoesListScreen({ onBack, onEdit, onAdd }: { onBack: () => void; onEdit: (id: string) => void; onAdd: (type: string) => void }) {
  const { mealCount, meals, deleteMeal } = useApp();
  const configs = MEAL_CONFIGS[mealCount];

  return (
    <div className="w-full max-w-md bg-gray-50 min-h-screen pb-32">
       <div className="bg-white pt-12 px-6 pb-6 flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-gray-100 rounded-xl">
             <X size={20} className="text-gray-500" />
          </button>
          <h1 className="text-xl font-black text-gray-900">Refeições do Dia</h1>
       </div>

       <div className="px-5 mt-4 space-y-4">
          {configs.map(cfg => {
            const registeredMeals = meals.filter(m => m.type === cfg.key);
            
            return (
              <div key={cfg.key} className="space-y-3">
                 <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{cfg.label}</span>
                 </div>
                 
                 {registeredMeals.length > 0 ? (
                   registeredMeals.map(meal => (
                    <div key={meal.id} className="bg-white rounded-[28px] p-4 border border-gray-100 shadow-sm">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <p className="text-sm font-black text-gray-800">{meal.items.length > 1 ? `${meal.items.length} itens` : meal.items[0]?.food.name}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">{meal.time} · {meal.cal} calorias</p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => deleteMeal(meal.id)} className="p-2 bg-red-50 text-red-500 rounded-xl">
                                <X size={14}/>
                             </button>
                             <button onClick={() => onEdit(meal.id)} className="px-3 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase">
                                Editar
                             </button>
                          </div>
                       </div>
                       <div className="flex gap-3">
                         {['P','C','G'].map((macro, i) => {
                           const val = i === 0 ? meal.p : i === 1 ? meal.c : meal.f;
                           return (
                             <div key={macro} className="bg-gray-50 px-3 py-1.5 rounded-xl flex items-baseline gap-1">
                                <span className="text-[8px] font-black text-gray-400">{macro}</span>
                                <span className="text-xs font-black text-gray-700">{val}g</span>
                             </div>
                           );
                         })}
                       </div>
                    </div>
                   ))
                 ) : (
                   <button 
                     onClick={() => onAdd(cfg.key)}
                     className="w-full p-6 bg-white rounded-[28px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-green-300 transition-all group"
                   >
                     <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                        <Plus size={18} className="text-gray-300 group-hover:text-green-500" />
                     </div>
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-700">Registrar agora</span>
                   </button>
                 )}
              </div>
            );
          })}
          
          <div className="h-20" />
       </div>
    </div>
  );
}

// ─── ADICIONAR REFEICAO SCREEN ────────────────────────────────────────────────

function AddMealScreen({ onBack }: { onBack: () => void }) {
  const { mealCount, pendingMealType, setPendingMealType, addMeal, updateMeal, pendingEditMealId, setPendingEditMealId, meals, mealPlan } = useApp();
  
  const [mealType, setMealType] = useState<string>(pendingMealType || 'cafe');
  const [items, setItems] = useState<MealEntry[]>([]);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [registroMode, setRegistroMode] = useState<'choosing' | 'plan' | 'manual'>(pendingEditMealId ? 'manual' : 'choosing');
  const [photo, setPhoto] = useState<string | null>(null);
  const [shareToCircle, setShareToCircle] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (pendingEditMealId) {
       const m = meals.find(x => x.id === pendingEditMealId);
       if (m) {
          setMealType(m.type);
          setItems(m.items);
          setRegistroMode('manual');
          if (m.photo) setPhoto(m.photo);
          if (m.shared !== undefined) setShareToCircle(m.shared);
       }
    }
  }, [pendingEditMealId, meals]);

  const configs = MEAL_CONFIGS[mealCount];
  const activeCfg = configs.find(c => c.key === mealType) || configs[0];

  const totals = items.reduce((acc, it) => ({
    cal: acc.cal + it.cal,
    p: acc.p + it.p,
    c: acc.c + it.c,
    f: acc.f + it.f,
  }), { cal: 0, p: 0, c: 0, f: 0 });

  const handleFinish = () => {
    if (items.length === 0) return;
    const body = {
      type: mealType,
      items,
      cal: totals.cal,
      p: Math.round(totals.p),
      c: Math.round(totals.c),
      f: Math.round(totals.f),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      photo: photo || undefined,
      shared: shareToCircle
    };

    if (pendingEditMealId) {
      updateMeal(pendingEditMealId, body);
      setPendingEditMealId(null);
    } else {
      addMeal(body);
    }
    setPendingMealType(null);
    onBack();
  };

  const handleAddPlanOption = (opt: any) => {
    const simulatedItem: MealEntry = {
      food: { name: opt.name, category: 'Plano', cal: opt.cal, p: Math.round(opt.cal * 0.08), c: Math.round(opt.cal * 0.12), f: Math.round(opt.cal * 0.03) },
      qty: 1, unit: 'un', cal: opt.cal, p: Math.round(opt.cal * 0.08), c: Math.round(opt.cal * 0.12), f: Math.round(opt.cal * 0.03)
    };
    setItems([simulatedItem]);
    setRegistroMode('manual');
  };

  return (
    <div className="w-full max-w-md bg-white min-h-screen pb-32 flex flex-col">
        <div className="bg-white pt-12 px-6 pb-6 border-b flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => { setPendingEditMealId(null); setPendingMealType(null); onBack(); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
          <div className="flex flex-col items-center text-center">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pendingEditMealId ? 'Editando' : 'Novo Registro'}</p>
             <h2 className="text-xl font-black text-gray-900 leading-tight">
               {activeCfg.label}
             </h2>
          </div>
          <div className="w-10"/>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {registroMode === 'choosing' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4 space-y-6">
                 <div className="text-center mb-8">
                    <p className="text-sm font-bold text-gray-500">Escolha como quer registrar.</p>
                 </div>
                 
                 <button onClick={() => setRegistroMode('plan')} className="w-full bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-50 flex items-center gap-6 group active:scale-95 transition-all">
                    <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                       <Book size={28} className="text-green-600" />
                    </div>
                    <div className="text-left">
                       <p className="font-black text-gray-900 text-lg">Usar plano</p>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight">Opções sugeridas</p>
                    </div>
                 </button>

                 <button onClick={() => setRegistroMode('manual')} className="w-full bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-50 flex items-center gap-6 group active:scale-95 transition-all">
                    <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                       <Plus size={28} className="text-orange-600" />
                    </div>
                    <div className="text-left">
                       <p className="font-black text-gray-900 text-lg">Manual</p>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight">Buscar alimentos</p>
                    </div>
                 </button>
              </motion.div>
            )}

            {registroMode === 'plan' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-4 space-y-4">
                 <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sugestões para {activeCfg.label}</p>
                    <button onClick={() => setRegistroMode('choosing')} className="text-[10px] font-black text-green-600 uppercase">Voltar</button>
                 </div>
                 {mealPlan[mealType]?.map((opt, i) => (
                   <button 
                    key={i} 
                    onClick={() => handleAddPlanOption(opt)}
                    className="w-full bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex justify-between items-center hover:border-green-500 transition-all text-left active:scale-95"
                   >
                      <div className="flex-1 pr-4 text-left">
                         <p className="font-black text-gray-800 text-sm mb-2">{opt.name}</p>
                         <div className="flex flex-col gap-1.5 opacity-60">
                            {opt.qty.split(' + ').map((it, idx) => (
                              <span key={idx} className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed flex items-center gap-2">
                                 <div className="w-1 h-1 bg-green-500 rounded-full shrink-0" />
                                 {it}
                              </span>
                            ))}
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="font-black text-green-600">{opt.cal}</p>
                         <p className="text-[8px] font-black text-gray-300 uppercase">calorias</p>
                      </div>
                   </button>
                 ))}
              </motion.div>
            )}

            {registroMode === 'manual' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-6">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Itens Selecionados</h3>
                  {!pendingEditMealId && <button onClick={() => setRegistroMode('choosing')} className="text-[10px] font-black text-gray-400 uppercase">Ajustar modo</button>}
                </div>

                <div className="space-y-3">
                  {items.map((it, idx) => (
                    <div key={idx} className="bg-gray-50/50 p-4 rounded-[24px] flex justify-between items-center border border-gray-100">
                      <div>
                        <p className="text-sm font-black text-gray-800">{it.food.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{it.qty}{it.unit === 'g' ? 'g' : (it.food.un || 'un')} · {it.cal} calorias</p>
                      </div>
                      <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  ))}

                  <button onClick={() => setShowFoodSearch(true)} className="w-full py-5 bg-green-50 rounded-[28px] border-2 border-dashed border-green-200 text-green-600 font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-green-100 transition-all active:scale-95">
                    <Plus size={18} /> Adicionar Alimento
                  </button>

                  <div className="pt-2 flex flex-col gap-4">
                     <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-3xl">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                              <Share size={18} />
                           </div>
                           <span className="text-[10px] font-black uppercase text-gray-400">Compartilhar no Círculo</span>
                        </div>
                        <button 
                          onClick={() => setShareToCircle(!shareToCircle)}
                          className={`w-12 h-6 rounded-full transition-all relative ${shareToCircle ? 'bg-indigo-500' : 'bg-gray-200'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${shareToCircle ? 'right-1' : 'left-1'}`} />
                        </button>
                     </div>

                     <div className="relative">
                        <input 
                           type="file" 
                           accept="image/*" 
                           onChange={handleFileChange} 
                           className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                        <div className={`w-full py-5 rounded-[28px] border-2 border-dashed flex items-center justify-center gap-2 transition-all ${photo ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                           {photo ? (
                             <>
                               <div className="w-8 h-8 rounded-lg overflow-hidden border border-indigo-200">
                                 <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                               </div>
                               <span className="text-[10px] font-black uppercase">Foto adicionada</span>
                               <button onClick={(e) => { e.stopPropagation(); setPhoto(null); }} className="ml-2 p-1 bg-white rounded-full shadow-sm">
                                 <X size={12} className="text-red-500" />
                               </button>
                             </>
                           ) : (
                             <>
                               <Smartphone size={18} />
                               <span className="text-[10px] font-black uppercase">Adicionar Foto</span>
                             </>
                           )}
                        </div>
                     </div>
                  </div>
                </div>

                {items.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
                    <button onClick={handleFinish} className="w-full bg-green-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-green-100 text-xs uppercase tracking-widest active:scale-95 transition-all">
                      Confirmar {items.length} {items.length === 1 ? 'Item' : 'Itens'}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AddFoodModal 
          isOpen={showFoodSearch} 
          onClose={() => setShowFoodSearch(false)}
          onAdd={(entry) => {
            setItems([...items, entry]);
            setShowFoodSearch(false);
          }}
        />
    </div>
  );
}

// ─── FINAL APP ────────────────────────────────────────────────────────────────

function RegisterWorkoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addWorkout, estimateBurned } = useApp();
  const [type, setType] = useState<WorkoutType>('musculacao');
  const [duration, setDuration] = useState('45');
  const [intensity, setIntensity] = useState<Intensity>('moderada');
  const [manualCals, setManualCals] = useState('');

  const handleSave = () => {
    const dur = parseInt(duration) || 0;
    const burned = manualCals ? parseInt(manualCals) : estimateBurned(type, dur, intensity);
    
    addWorkout({
      id: Date.now().toString(),
      type,
      duration: dur,
      intensity,
      burned,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-gray-900">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black">Registrar Treino</h2>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-xl"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tipo de Exercício</label>
                  <div className="grid grid-cols-3 gap-2">
                    {WORKOUT_TYPES.map(w => (
                      <button key={w.key} onClick={() => setType(w.key)} className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all ${type === w.key ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                        <w.icon size={20} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">{w.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Duração (min)</label>
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-4 bg-gray-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Calorias (opcional)</label>
                    <input type="number" placeholder="Auto" value={manualCals} onChange={e => setManualCals(e.target.value)} className="w-full p-4 bg-gray-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Intensidade</label>
                  <div className="flex gap-2">
                    {INTENSITIES.map(i => (
                      <button key={i.key} onClick={() => setIntensity(i.key)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${intensity === i.key ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button
  data-testid="save-workout"
  onClick={handleSave}
  className="w-full bg-orange-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-orange-100 text-xs uppercase tracking-widest active:scale-95 transition-all"
>
  Salvar Treino
</button>
                <p className="text-[10px] text-gray-400 font-bold italic text-center leading-relaxed">
                  As calorias do treino são estimativas. Use como referência.
                </p>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MobileFrame>
        <Navigation />
      </MobileFrame>
    </AppProvider>
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
        <main className="flex-1 min-h-0 overflow-y-auto w-full no-scrollbar scroll-smooth pb-28">
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
        {screen === 'circulo' && <CirculoScreen />}
        {screen === 'perfil' && <PerfilScreen />}
      </main>

      <RegisterWorkoutModal isOpen={showWorkoutModal} onClose={() => setShowWorkoutModal(false)} />

      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-6 pb-32">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuickAdd(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
             <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 space-y-6 text-gray-900">
                <h3 className="text-xl font-black text-center">O que fazer agora?</h3>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => handleQuickAdd('meal')} data-testid="quick-add-meal" className="bg-green-50 p-6 rounded-3xl flex flex-col items-center gap-3 border border-green-100 active:scale-95 transition-all">
                      <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100">
                        <Utensils size={24} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-tighter text-green-700 text-center">Registrar Refeição</span>
                   </button>
                   <button onClick={() => handleQuickAdd('workout')} data-testid="quick-add-workout" className="bg-orange-50 p-6 rounded-3xl flex flex-col items-center gap-3 border border-orange-100 active:scale-95 transition-all">
                      <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                        <Dumbbell size={24} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-tighter text-orange-700 text-center">Registrar Treino</span>
                   </button>
                </div>
                <button onClick={() => setShowQuickAdd(false)} className="w-full py-4 bg-gray-100 text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">Fechar</button>
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

// ─── EXTRA ICON IMPORTS ───
