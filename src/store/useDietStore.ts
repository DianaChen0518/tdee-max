import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { Food, RecipeCombo } from '../types';
import { generateId } from '../utils/IdUtils';
import i18n from '../i18n';

export const useDietStore = defineStore('diet', () => {
  const { t } = i18n.global;

  const commonFoods = useStorage<Food[]>('tdee_foods_v2', [
    { id: generateId(), name: t('defaults.foods.chicken'), cals: 133 },
    { id: generateId(), name: t('defaults.foods.rice'), cals: 116 },
    { id: generateId(), name: t('defaults.foods.egg'), cals: 75 },
    { id: generateId(), name: t('defaults.foods.coffee'), cals: 5 }
  ]);

  const recipeCombos = useStorage<RecipeCombo[]>('tdee_recipe_combos', []);

  // Data Migration for legacy IDs
  commonFoods.value.forEach(f => {
    if (!f.id) f.id = generateId();
  });
  recipeCombos.value.forEach(rc => {
    rc.foods.forEach(f => {
      if (!f.id) f.id = generateId();
    });
  });

  const addCommonFood = (food: Food) => {
    commonFoods.value.push({ ...food, id: generateId() });
  };

  const removeCommonFood = (index: number) => {
    commonFoods.value.splice(index, 1);
  };

  const addRecipeCombo = (combo: RecipeCombo) => {
    recipeCombos.value.push(combo);
  };

  const removeRecipeCombo = (index: number) => {
    recipeCombos.value.splice(index, 1);
  };

  return {
    commonFoods,
    recipeCombos,
    addCommonFood,
    removeCommonFood,
    addRecipeCombo,
    removeRecipeCombo
  };
});
