import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Workout } from '../api';

@Component({
  imports: [CommonModule],
  selector: 'app-workouts-page',
  templateUrl: './workouts-page.html',
})
export class WorkoutsPage {
  @Input({ required: true }) workouts: Workout[] = [];
  @Input({ required: true }) isDashboard = false;
  @Input({ required: true }) formatDate!: (value: string) => string;
  @Input({ required: true }) getWorkoutIcon!: (type: Workout['type']) => string;
  @Output() readonly addWorkout = new EventEmitter<void>();
  @Output() readonly editWorkout = new EventEmitter<Workout>();
  @Output() readonly deleteWorkout = new EventEmitter<string>();
  @Output() readonly viewAll = new EventEmitter<void>();
}
