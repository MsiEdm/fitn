import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FitnessGoal, Workout } from '../api';
import { ActivityChart, ChartDay } from './activity-chart';
import { WorkoutsPage } from './workouts-page';

@Component({
  imports: [CommonModule, ActivityChart, WorkoutsPage],
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.html',
})
export class DashboardPage {
  @Input({ required: true }) weekWorkoutsCount = 0;
  @Input({ required: true }) weekMinutes = 0;
  @Input({ required: true }) weekCalories = 0;
  @Input({ required: true }) monthWorkoutsCount = 0;
  @Input({ required: true }) monthCalories = 0;
  @Input({ required: true }) chartDays: ChartDay[] = [];
  @Input({ required: true }) goals: FitnessGoal[] = [];
  @Input({ required: true }) recentWorkouts: Workout[] = [];
  @Input({ required: true }) formatDate!: (value: string) => string;
  @Input({ required: true }) getWorkoutIcon!: (type: Workout['type']) => string;
  @Input({ required: true }) goalProgress!: (goal: FitnessGoal) => number;
  @Output() readonly addWorkout = new EventEmitter<void>();
  @Output() readonly addGoal = new EventEmitter<void>();
  @Output() readonly editWorkout = new EventEmitter<Workout>();
  @Output() readonly deleteWorkout = new EventEmitter<string>();
  @Output() readonly viewWorkouts = new EventEmitter<void>();
  @Output() readonly viewGoals = new EventEmitter<void>();
}
