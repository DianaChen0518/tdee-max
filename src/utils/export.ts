import * as XLSX from 'xlsx';
import { ReportingService } from '../services/ReportingService';
import { DateUtils } from './DateUtils';
import { Database, UserProfile } from '../types';

export const exportTdeeData = (database: Database, userProfile: UserProfile) => {
  const records = ReportingService.getProcessingRecords(database, userProfile);
  
  const exportData = records.map(r => ({
    "日期": r.date,
    "体重(kg)": r.weight,
    "总摄入(kcal)": Math.round(r.intake),
    "总消耗_TDEE(kcal)": Math.round(r.tdee),
    "当日缺口(kcal)": Math.round(r.deficit)
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "数据追踪");
  XLSX.writeFile(wb, `TDEE_Data_${DateUtils.getLocalYYYYMMDD()}.xlsx`);
};
