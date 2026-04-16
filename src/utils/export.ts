import * as XLSX from 'xlsx';
import { CalculatorService } from '../services/CalculatorService';
import { DateUtils } from './DateUtils';
import { Database, UserProfile } from '../types';

export const exportTdeeData = (database: Database, userProfile: UserProfile) => {
  const exportData = Object.entries(database).map(([date, data]) => {
    const summary = CalculatorService.calculateDailySummary(data, userProfile);

    return {
      "日期": date,
      "体重(kg)": data.weight,
      "步数": data.steps,
      "运动消耗_EAT(kcal)": Math.round(summary.eat),
      "总摄入(kcal)": Math.round(summary.intake),
      "总消耗_TDEE(kcal)": Math.round(summary.tdee),
      "当日缺口(kcal)": Math.round(summary.deficit)
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "数据追踪");
  XLSX.writeFile(wb, `TDEE_Data_${DateUtils.getLocalYYYYMMDD()}.xlsx`);
};
