export default {
  header: {
    title: 'Scientific TDEE Manager',
    audit: 'Reports',
    datavis: 'Dynamic Analytics',
    settings: 'Settings',
    dark: 'Dark',
    light: 'Light',
    backToToday: 'Today'
  },
  dashboard: {
    title: 'Energy Dashboard',
    save: 'Save Daily',
    reset: 'Clear / Reset',
    export: 'Export History to Excel',
    intake: 'Intake',
    totalIntake: 'Total Intake',
    tdee: 'TDEE',
    deficit: 'Deficit',
    dailyDeficit: 'Daily Caloric Deficit',
    equivalentTo: 'Equivalent to {action} {val}g fat',
    actionConsuming: 'burning',
    actionStoring: 'gaining',
    overLimit: 'Over limit by {val} kcal!',
    steps: 'Steps',
    weight: 'Weight',
    metrics: {
      bmr: 'BMR (Base Metabolism)',
      neat: 'NEAT (Steps/Daily)',
      tef: 'TEF (Food Thermic Effect)',
      eat: 'EAT (Exercise Energy)',
      epoc: 'EPOC (Afterburn)',
      errorMargin: '(±20%~25% margin)'
    },
    confirmReset: '⚠️ DANGER:\nAre you sure you want to clear all data for {date}?\nThis action is irreversible!'
  },
  diet: {
    title: 'Dietary Intake',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    uncategorized: 'Uncategorized',
    placeholderFood: 'Food Name',
    placeholderCals: 'Calories',
    unitKcal: 'kcal',
    unitKj: 'kJ',
    eat: 'Log Food',
    saveQuick: 'Save Quick',
    comboTitle: 'Quick Meals Library',
    saveCombo: 'Save as Combo',
    copyTomorrow: 'Copy to Tomorrow',
    empty: 'No entries for today',
    copyYesterday: 'Copy from Yesterday',
    comboPrompt: 'Enter combo name (will save {count} items):',
    comboDefaultName: '{meal} common selection',
    mealLabels: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      uncategorized: 'Uncategorized'
    }
  },
  notifications: {
    saveSuccess: 'Data for {date} saved to local storage',
    syncing: 'Syncing to Gist cloud...',
    syncSuccess: 'Cloud backup successful!',
    syncError: 'Cloud sync failed: {msg}',
    quickFoodSaved: 'Saved to Quick Library',
    comboSaved: 'Combo [{name}] saved',
    comboLoaded: 'Combo [{name}] loaded',
    copyTomorrowSuccess: '{name} successfully sent to tomorrow',
    resetSuccess: 'Daily data reset',
    comboEmptyError: 'No items in this meal to save!'
  },
  workout: {
    title: 'Workout Logging',
    add: 'Add Record',
    empty: 'No workout entries for today',
    types: {
      aerobic: '🏃 Aerobic (Heart Rate)',
      anaerobic: '🏋️ Anaerobic (METs)',
      manual: '⚡ Manual (Tracker/App)'
    },
    labels: {
      hr: 'Avg Heart Rate',
      mins: 'Duration (min)',
      secs: 'Duration (sec)',
      intensity: 'Intensity',
      kcal: 'Calories burned from Tracker/App (kcal)'
    },
    intensities: {
      low: 'Low (Warmup)',
      med: 'Med (Hypertrophy)',
      high: 'High (Heavy Compound)'
    }
  },
  settings: {
    title: 'Personal Physiology Settings',
    firstTimeTip: 'Required for first-time use! This data is stored locally in your browser for absolute privacy.',
    changeTip: 'Changes here will affect global BMR and metabolic calculation formulas.',
    labels: {
      birthDate: 'Birth Date (for age calculation)',
      height: 'Height (cm)',
      rhr: 'Resting Heart Rate (RHR)',
      gender: 'Biological Gender (for Mifflin-St Jeor)',
      token: 'GitHub PAT (Token)',
      gistId: 'Backup Gist ID (leave blank to create new)'
    },
    rhrTip: '💡 Precise heart rate reserve (HRR) derivation based on Tanaka formula. EPOC afterburn effects use a triple-segment intensity model with duration correction (0.7x - 1.1x) to ensure accurate compensation.',
    genders: {
      M: 'Male',
      F: 'Female'
    },
    gist: {
      title: 'GitHub Gist Cloud Sync',
      tip: 'Use GitHub Private Gist for data backup and cross-device roaming.'
    },
    actions: {
      backup: 'Push to Cloud',
      restore: 'Pull from Cloud',
      saveClose: 'Finish & Close',
      saveStart: 'Save & Start'
    },
    messages: {
      restoreConfirm: 'This will overwrite all local records with cloud data. Proceed?',
      tokenRequired: 'GitHub Token is required for sync!',
      tokenGistRequired: 'Both Token and Gist ID are required for restore!',
      backupSuccess: 'Cloud backup successful!',
      restoreSuccess: 'History data restored from cloud!',
      syncError: 'Sync error: {message}',
      restoreError: 'Restore error: {message}'
    }
  },
  datavis: {
    title: 'Data Visual Analytics',
    close: 'Close Panel',
    empty: 'No records found',
    ranges: {
      7: 'Last 7 Days',
      30: 'Last 30 Days',
      all: 'All Time'
    },
    stats: {
      totalDeficit: 'Total Caloric Deficit',
      fatChange: 'Theoretical Fat Change',
      fatLost: 'Lost',
      fatGained: 'Gained',
      avgIntake: 'Avg Intake'
    },
    charts: {
      weightTrend: '📉 Weight Trend Analysis',
      energyAgainst: '🔥 Energy Balance (TDEE vs Intake)',
      weightLabel: 'Weight (kg)',
      intakeLabel: 'Intake (Energy)',
      tdeeLabel: 'TDEE (Consulmed)'
    },
    details: 'Recent Details (Last 7)'
  },
  export: {
    sheetName: 'History Records',
    columns: {
      date: 'Date',
      weight: 'Weight(kg)',
      intake: 'Intake(kcal)',
      tdee: 'TDEE(kcal)',
      deficit: 'Deficit(kcal)'
    }
  },
  defaults: {
    foods: {
      chicken: 'Raw Chicken Breast (100g)',
      rice: 'Cooked Rice (100g)',
      egg: 'Boiled Egg (1pc)',
      coffee: 'Black Coffee'
    }
  }
};
