import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FitnessGoal } from '../api';

@Component({
  imports: [CommonModule],
  selector: 'app-goals-page',
  templateUrl: './goals-page.html',
})
export class GoalsPage {
  @Input({ required: true }) goals: FitnessGoal[] = [];
  @Input({ required: true }) formatDate!: (value: string) => string;
  @Input({ required: true }) goalProgress!: (goal: FitnessGoal) => number;
  @Output() readonly addGoal = new EventEmitter<void>();
  @Output() readonly editGoal = new EventEmitter<FitnessGoal>();
  @Output() readonly deleteGoal = new EventEmitter<string>();
}
