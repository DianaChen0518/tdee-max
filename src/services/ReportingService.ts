import { CalculatorService } from './CalculatorService';
import { DateUtils } from '../utils/DateUtils';
import { Database, UserProfile, DayData } from '../types';

/**
 * Interface for a summarized day in reports.
 */
export interface DaySummaryRecord {
  date: string;
  weight: number;
  tdee: number;
  intake: number;
  deficit: number;
}

/**
 * Interface for aggregated range statistics.
 */
export interface RangeStats {
  totalDeficit: number;
  avgIntake: number;
  theoreticalFatChangeGrams: number;
  recordCount: number;
}

/**
 * Reporting Service centralizes data aggregation and trend analysis.
 * Decouples business logic from visualization components.
 */
export class ReportingService {
  /**
   * Filters and processes database entries into structured summary records.
   * Centralizes the definition of what constitutes a "valid" record.
   */
  static getProcessingRecords(
    db: Database, 
    profile: UserProfile, 
    filter?: (date: string, data: DayData) => boolean
  ): DaySummaryRecord[] {
    const records: DaySummaryRecord[] = [];
    const today = DateUtils.getLocalYYYYMMDD();
    
    for (const [date, data] of Object.entries(db)) {
      // Logic fix: Exclude today (and future dates) from statistics to avoid skewed results
      if (date >= today) continue;

      // Apply custom filter if provided
      if (filter && !filter(date, data)) continue;

      // Global "Valid Entry" check: Must have at least one meaningful data point
      const hasData = data.weight > 0 || data.steps > 0 || data.foods.length > 0 || data.workouts.length > 0;
      if (!hasData) continue;

      const summary = CalculatorService.calculateDailySummary(data, profile, date);
      
      records.push({
        date,
        weight: data.weight,
        tdee: summary.tdee,
        intake: summary.intake,
        deficit: summary.deficit
      });
    }

    return records.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Aggregates a list of records into high-level stats.
   */
  static aggregateStats(records: DaySummaryRecord[]): RangeStats {
    if (records.length === 0) {
      return { totalDeficit: 0, avgIntake: 0, theoreticalFatChangeGrams: 0, recordCount: 0 };
    }

    const totalDeficit = records.reduce((sum, r) => sum + r.deficit, 0);
    const totalIntake = records.reduce((sum, r) => sum + r.intake, 0);
    
    return {
      totalDeficit,
      avgIntake: totalIntake / records.length,
      theoreticalFatChangeGrams: totalDeficit / 7.7,
      recordCount: records.length
    };
  }

  /**
   * Specifically handles monthly aggregation.
   */
  static getMonthlyReport(db: Database, profile: UserProfile, monthStr: string) {
    const monthRecords = this.getProcessingRecords(db, profile, (date) => date.startsWith(monthStr));
    const stats = this.aggregateStats(monthRecords);
    
    return {
      records: [...monthRecords].reverse(), // Newest first for UI lists
      stats
    };
  }
}
