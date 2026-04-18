import { Database, DayData, Food } from '../types';
import { generateId } from './IdUtils';

/**
 * Utility for managing daily data operations.
 * Separates complex data transformation logic from state management.
 * Implements "Dumb Data" transformation patterns.
 */
export class DayManager {
  
  /**
   * Initializes a day record with intelligent weight carry-over.
   */
  public static initDay(database: Database, dateStr: string): DayData {
    if (database[dateStr]) return database[dateStr];

    // Intelligent carry-over: find the most recent available weight
    let defaultWeight = 0;
    const pastDates = Object.keys(database)
      .filter(d => d < dateStr)
      .sort((a, b) => b.localeCompare(a)); // Sort descending to find closest past date

    if (pastDates.length > 0) {
      defaultWeight = database[pastDates[0]].weight;
    }

    return { 
      weight: defaultWeight, 
      steps: 0, 
      workouts: [], 
      foods: [] 
    };
  }

  /**
   * Finds the last day before dateStr that has food logs and returns its foods.
   */
  public static findLastDietDayFoods(database: Database, dateStr: string): Food[] {
    const pastDates = Object.keys(database)
      .filter(d => d < dateStr && database[d].foods.length > 0)
      .sort((a, b) => b.localeCompare(a));
    
    if (pastDates.length === 0) return [];
    
    // Deep copy to prevent state leakage
    return database[pastDates[0]].foods.map(f => ({ ...f, id: generateId() }));
  }

  /**
   * Copies foods from one day/meal-type to another.
   * Handles deduplication and multiplier accumulation.
   */
  public static copyFoods(
    sourceFoods: Food[], 
    targetFoods: Food[], 
    mealTypeFilter: string
  ): Food[] {
    const foodsToCopy = sourceFoods.filter(f => (f.mealType || 'uncategorized') === mealTypeFilter);
    if (foodsToCopy.length === 0) return targetFoods;

    const newTargetFoods = [...targetFoods];

    foodsToCopy.forEach(sourceFood => {
      const targetType = sourceFood.mealType || 'uncategorized';
      const existing = newTargetFoods.find(f => 
        f.name === sourceFood.name && (f.mealType || 'uncategorized') === targetType
      );
      
      const multiplierToAdd = Math.max(1, sourceFood.multiplier || 1);
      
      if (existing) {
        existing.multiplier = (existing.multiplier || 1) + multiplierToAdd;
      } else {
        newTargetFoods.push({ 
          ...sourceFood, 
          id: generateId(),
          multiplier: multiplierToAdd 
        });
      }
    });

    return newTargetFoods;
  }
}
