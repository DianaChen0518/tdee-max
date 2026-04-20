import { ReportingService } from '../services/ReportingService';
import { DateUtils } from './DateUtils';
import { Database, UserProfile } from '../types';
import i18n from '../i18n';

export const exportTdeeData = async (database: Database, userProfile: UserProfile) => {
  const records = ReportingService.getProcessingRecords(database, userProfile);
  const { t } = i18n.global;

  const exportData = records.map(r => ({
    [t('export.columns.date')]: r.date,
    [t('export.columns.weight')]: r.weight,
    [t('export.columns.intake')]: Math.round(r.intake),
    [t('export.columns.tdee')]: Math.round(r.tdee),
    [t('export.columns.deficit')]: Math.round(r.deficit)
  }));

  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('export.sheetName'));
  XLSX.writeFile(wb, `TDEE_Data_${DateUtils.getLocalYYYYMMDD()}.xlsx`);
};
