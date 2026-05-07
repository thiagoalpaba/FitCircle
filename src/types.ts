import type { FoodItem } from './data/foods';
import type { MealCount } from './data/mealConfigs';
import type { Intensity, WorkoutType } from './data/workouts';

export interface MealEntry {
  food: FoodItem;
  qty: number;
  unit: 'g' | 'un';
  cal: number;
  p: number;
  c: number;
  f: number;
}

export interface Meal {
  id: string;
  type: string;
  items: MealEntry[];
  cal: number;
  p: number;
  c: number;
  f: number;
  time: string;
shared?: boolean

}

export interface Workout {
  id: string;
  type: WorkoutType;
  duration: number;
  intensity: Intensity;
  burned: number;
  time: string;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: 'masculino' | 'feminino';
  goal: 'perda' | 'ganho' | 'manutencao';
  trainingsPerWeek: number;
  mealCount: MealCount;
  mainDifficulty: string;
  restrictions: string[];
  preferredIngredients: {
    breakfast: string[];
    main: string[];
    snacks: string[];
  };
  photo?: string;
  dietaryStyle?: 'sem_restricao' | 'vegetariano' | 'vegano' | 'pescetariano' | 'flexivel';
  blockedFoods?: string[];
}

export interface AppCtx {
  meals: Meal[];
  customFoods: FoodItem[];
  workouts: Workout[];
  mealCount: MealCount;
  pendingMealType: string | null;
  pendingEditMealId: string | null;
  myCheckin: string;
  calorieGoal: number;
  macros: { p: number; c: number; f: number };
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  onboarded: boolean;

  addMeal: (m: Omit<Meal, 'id'>) => void;
  updateMeal: (id: string, m: Partial<Meal>) => void;
  deleteMeal: (id: string) => void;
  addCustomFood: (f: FoodItem) => void;

  setWorkouts: (w: Workout[]) => void;
  addWorkout: (w: Workout) => void;
  deleteWorkout: (id: string) => void;

  setMealCount: (n: MealCount) => void;
  setPendingMealType: (t: string | null) => void;
  setPendingEditMealId: (id: string | null) => void;
  setMyCheckin: (s: string) => void;

  getTotals: () => { cal: number; p: number; c: number; f: number };
  estimateBurned: (type: WorkoutType, dur: number, intensity: Intensity) => number;

  login: (email: string) => void;
  signup: (email: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  completeScreening: (profile: UserProfile) => void;
  resetApp: () => void;
  fillDemo: () => void;

  mealPlan: Record<string, { 
  name: string; 
  qty: string; 
  cal: number; 
  p?: number;
  c?: number;
  f?: number;
  category?: string; 
  isLowProt?: boolean; 
  isLighter?: boolean; 
  badge?: string; 
  badgeDesc?: string;
  fromRecipe?: boolean;
  recipeId?: string;
  swappedAt?: number;
}[]>;
generateNewPlan: (mealKey?: string) => void;
swapMealItem: (mealKey: string, index: number) => void;
addRecipeToPlan: (recipe: any, mealKey: string) => void;
}