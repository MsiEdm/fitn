import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivityChart, ChartDay } from './activity-chart';

@Component({
  imports: [CommonModule, ActivityChart],
  selector: 'app-stats-page',
  templateUrl: './stats-page.html',
})
export class StatsPage {
  @Input({ required: true }) weekMinutes = 0;
  @Input({ required: true }) chartDays: ChartDay[] = [];
  @Input({ required: true }) monthWorkoutsCount = 0;
  @Input({ required: true }) monthCalories = 0;
  @Input({ required: true }) monthMinutes = 0;
  @Input({ required: true }) goalCount = 0;
}
