import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface ChartDay {
  label: string;
  value: number;
  height: number;
  isToday: boolean;
}

@Component({
  imports: [CommonModule],
  selector: 'app-activity-chart',
  templateUrl: './activity-chart.html',
})
export class ActivityChart {
  @Input({ required: true }) weekMinutes = 0;
  @Input({ required: true }) chartDays: ChartDay[] = [];
}
