import { Workout, DayData, UserProfile } from '../types';

export const calculateAge = (birthDateStr: string): number => {
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age || 0;
};

export const calcBMR = (weight: number, height: number, age: number, gender: 'M'|'F') => {
  if (!weight) return 0;
  const offset = gender === 'M' ? 5 : -161;
  return (10 * weight) + (6.25 * height) - (5 * age) + offset;
};

export const calcNEAT = (weight: number, steps: number) => {
  if (!weight || !steps) return 0;
  return steps * 0.045 * (weight / 100);
};

// 修正：增加 gender 参数，采用公制系数并区分男女公式
export const calcEAT = (workouts: Workout[], weight: number, age: number, gender: 'M'|'F') => {
  if (!weight) return 0;
  return workouts.reduce((total, wo) => {
    const type = wo.type || 'aerobic'; 
    
    if (type === 'manual') {
      return total + Math.max(0, parseFloat((wo.kcal || 0) as unknown as string) || 0);
    }
    
    const totalMins = (parseFloat((wo.mins || 0) as unknown as string) || 0) + ((parseFloat((wo.secs || 0) as unknown as string) || 0) / 60);
    if (totalMins <= 0) return total;

    if (type === 'aerobic') {
      const hr = parseFloat((wo.hr || 0) as unknown as string) || 0;
      if (hr > 80) {
        let kcalPerMin = 0;
        // 采用精准的 Keytel et al. (2005) 公制 (kg) 公式
        if (gender === 'M') {
          kcalPerMin = (-55.0969 + 0.6309 * hr + 0.1988 * weight + 0.2017 * age) / 4.184;
        } else {
          kcalPerMin = (-20.4022 + 0.4472 * hr - 0.1263 * weight + 0.0740 * age) / 4.184;
        }
        return total + Math.max(0, kcalPerMin * totalMins);
      }
    } 
    else if (type === 'anaerobic') {
      const met = wo.intensity === 'high' ? 7.0 : (wo.intensity === 'low' ? 3.5 : 5.0);
      const kcal = met * weight * (totalMins / 60);
      return total + Math.max(0, kcal);
    }
    
    return total;
  }, 0);
};

export const calculateDailySummary = (data: DayData, profile: UserProfile, age: number) => {
  const bmr = calcBMR(data.weight, profile.heightCm, age, profile.gender);
  const neat = calcNEAT(data.weight, data.steps);
  const eat = calcEAT(data.workouts, data.weight, age, profile.gender);
  const tdee = (bmr * 1.1) + neat + eat;
  const intake = data.foods.reduce((sum, f) => sum + (f.cals * (f.multiplier || 1)), 0);
  const deficit = tdee - intake;

  return { bmr, neat, eat, tdee, intake, deficit };
};
