import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, FitnessApi, FitnessGoal, WeeklyStats, Workout } from './api';

type Section = 'dashboard' | 'workouts' | 'goals' | 'stats';

type WorkoutType = Workout['type'];
const workoutTypes: WorkoutType[] = ['Course', 'Musculation', 'Vélo', 'Natation', 'Yoga', 'Autre'];

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(FitnessApi);
  protected readonly section = signal<Section>('dashboard');
  protected readonly workouts = signal<Workout[]>([]);
  protected readonly goals = signal<FitnessGoal[]>([]);
  protected readonly weeklyStats = signal<WeeklyStats | null>(null);
  protected readonly workoutTypes = workoutTypes;
  protected readonly today = new Date();
  protected readonly weekStart = this.startOfWeek(this.today);
  protected readonly workoutModalOpen = signal(false);
  protected readonly goalModalOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly editingWorkoutId = signal<string | null>(null);
  protected readonly editingGoalId = signal<string | null>(null);
  protected readonly registerMode = signal(false);
  protected readonly requestBusy = signal(false);
  protected readonly errorMessage = signal('');
  protected authForm = { username: '', email: '', password: '' };

  protected workoutForm: Omit<Workout, 'id'> = this.emptyWorkout();
  protected goalForm: Omit<FitnessGoal, 'id' | 'status'> = this.emptyGoal();

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) this.loadData();
  }

  protected toggleAuthMode(): void {
    this.registerMode.update((mode) => !mode);
    this.errorMessage.set('');
  }

  protected submitAuth(): void {
    if (this.requestBusy()) return;
    this.requestBusy.set(true);
    this.errorMessage.set('');
    const request = this.registerMode()
      ? this.auth.register(
          this.authForm.username.trim(),
          this.authForm.email.trim(),
          this.authForm.password,
        )
      : this.auth.login(this.authForm.email.trim(), this.authForm.password);
    request.subscribe({
      next: () => {
        this.requestBusy.set(false);
        this.authForm.password = '';
        this.loadData();
      },
      error: (error: unknown) => {
        this.requestBusy.set(false);
        this.errorMessage.set(this.describeError(error));
      },
    });
  }

  protected logout(): void {
    this.auth.logout();
    this.workouts.set([]);
    this.goals.set([]);
    this.weeklyStats.set(null);
    this.section.set('dashboard');
    this.errorMessage.set('');
  }

  private loadData(): void {
    this.api.getWorkouts().subscribe({
      next: (workouts) => this.workouts.set(workouts),
      error: (error: unknown) => this.errorMessage.set(this.describeError(error)),
    });
    this.api.getGoals().subscribe({
      next: (goals) => this.goals.set(goals),
      error: (error: unknown) => this.errorMessage.set(this.describeError(error)),
    });
    this.api.getWeeklyStats().subscribe({
      next: (stats) => this.weeklyStats.set(stats),
      error: (error: unknown) => this.errorMessage.set(this.describeError(error)),
    });
  }

  private refreshWeeklyStats(): void {
    this.api.getWeeklyStats().subscribe({
      next: (stats) => this.weeklyStats.set(stats),
      error: (error: unknown) => this.errorMessage.set(this.describeError(error)),
    });
  }

  protected readonly weekWorkouts = computed(() =>
    this.workouts().filter((workout) => {
      const date = this.parseDate(workout.date);
      return date >= this.weekStart && date <= this.endOfToday();
    }),
  );
  protected readonly weekCalories = computed(
    () =>
      this.weeklyStats()?.totalCaloriesBurned ??
      this.weekWorkouts().reduce((total, workout) => total + workout.caloriesBurned, 0),
  );
  protected readonly weekMinutes = computed(
    () =>
      this.weeklyStats()?.totalDurationMinutes ??
      this.weekWorkouts().reduce((total, workout) => total + workout.durationMinutes, 0),
  );
  protected readonly monthWorkouts = computed(() =>
    this.workouts().filter((workout) => {
      const date = this.parseDate(workout.date);
      return (
        date.getMonth() === this.today.getMonth() && date.getFullYear() === this.today.getFullYear()
      );
    }),
  );
  protected readonly monthCalories = computed(() =>
    this.monthWorkouts().reduce((total, workout) => total + workout.caloriesBurned, 0),
  );
  protected readonly monthMinutes = computed(() =>
    this.monthWorkouts().reduce((total, workout) => total + workout.durationMinutes, 0),
  );
  protected readonly weekProgress = computed(() => Math.min(this.weekWorkouts().length * 25, 100));
  protected readonly recentWorkouts = computed(() =>
    [...this.workouts()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
  );
  protected readonly chartDays = computed(() => {
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const values = labels.map((_, index) => {
      const date = new Date(this.weekStart);
      date.setDate(date.getDate() + index);
      const dateString = this.dateInputValue(date);
      const serverDay = this.weeklyStats()?.daily.find((day) => day.date === dateString);
      return (
        serverDay?.durationMinutes ??
        this.weekWorkouts()
          .filter((workout) => workout.date === dateString)
          .reduce((total, workout) => total + workout.durationMinutes, 0)
      );
    });
    const max = Math.max(60, ...values);
    return labels.map((label, index) => ({
      label,
      value: values[index],
      height: values[index] ? Math.max(8, (values[index] / max) * 100) : 4,
      isToday:
        this.dateInputValue(new Date(this.weekStart.getTime() + index * 86_400_000)) ===
        this.dateInputValue(this.today),
    }));
  });

  protected selectSection(section: Section): void {
    this.section.set(section);
    this.mobileMenuOpen.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected openWorkout(workout?: Workout): void {
    this.editingWorkoutId.set(workout?.id ?? null);
    this.workoutForm = workout
      ? {
          type: workout.type,
          durationMinutes: workout.durationMinutes,
          caloriesBurned: workout.caloriesBurned,
          date: workout.date,
          notes: workout.notes,
        }
      : this.emptyWorkout();
    this.workoutModalOpen.set(true);
  }

  protected saveWorkout(): void {
    if (
      !this.workoutForm.type ||
      this.workoutForm.durationMinutes <= 0 ||
      this.workoutForm.caloriesBurned < 0 ||
      !this.workoutForm.date
    )
      return;
    const id = this.editingWorkoutId();
    this.errorMessage.set('');
    const request = id
      ? this.api.updateWorkout(id, this.workoutForm)
      : this.api.createWorkout(this.workoutForm);
    request.subscribe({
      next: (workout) => {
        this.workouts.update((workouts) =>
          id ? workouts.map((item) => (item.id === id ? workout : item)) : [workout, ...workouts],
        );
        this.refreshWeeklyStats();
        this.workoutModalOpen.set(false);
      },
      error: (error: unknown) => this.errorMessage.set(this.describeError(error)),
    });
  }

  protected deleteWorkout(id: string): void {
    this.errorMessage.set('');
    this.api.deleteWorkout(id).subscribe({
      next: () => {
        this.workouts.update((workouts) => workouts.filter((workout) => workout.id !== id));
        this.refreshWeeklyStats();
      },
      error: (error: unknown) => this.errorMessage.set(this.describeError(error)),
    });
  }

  protected openGoal(goal?: FitnessGoal): void {
    this.editingGoalId.set(goal?.id ?? null);
    this.goalForm = goal
      ? {
          title: goal.title,
          startValue: goal.startValue,
          targetValue: goal.targetValue,
          currentValue: goal.currentValue,
          unit: goal.unit,
          deadline: goal.deadline,
        }
      : this.emptyGoal();
    this.goalModalOpen.set(true);
  }

  protected saveGoal(): void {
    if (
      !this.goalForm.title.trim() ||
      this.goalForm.targetValue <= 0 ||
      this.goalForm.currentValue < 0 ||
      !this.goalForm.deadline
    )
      return;
    const id = this.editingGoalId();
    const payload = { ...this.goalForm, title: this.goalForm.title.trim() };
    const request = id ? this.api.updateGoal(id, payload) : this.api.createGoal(payload);
    request.subscribe({
      next: (goal) => {
        this.goals.update((goals) =>
          id ? goals.map((item) => (item.id === id ? goal : item)) : [goal, ...goals],
        );
        this.goalModalOpen.set(false);
      },
      error: (error: unknown) => this.errorMessage.set(this.describeError(error)),
    });
  }

  protected deleteGoal(id: string): void {
    this.errorMessage.set('');
    this.api.deleteGoal(id).subscribe({
      next: () => this.goals.update((goals) => goals.filter((goal) => goal.id !== id)),
      error: (error: unknown) => this.errorMessage.set(this.describeError(error)),
    });
  }

  protected goalProgress(goal: FitnessGoal): number {
    if (goal.targetValue === goal.currentValue) return 100;
    if (goal.startValue === goal.targetValue) return 0;
    const progress = (goal.currentValue - goal.startValue) / (goal.targetValue - goal.startValue);
    return Math.max(0, Math.min(100, Math.round(progress * 100)));
  }

  protected formatDate(value: string): string {
    return this.parseDate(value).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  protected get greeting(): string {
    const hour = this.today.getHours();
    return hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  }

  protected get dateLabel(): string {
    return this.today.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  protected get sectionTitle(): string {
    return {
      dashboard: 'Vue d’ensemble',
      workouts: 'Mes séances',
      goals: 'Mes objectifs',
      stats: 'Statistiques',
    }[this.section()];
  }

  protected getWorkoutIcon(type: WorkoutType): string {
    return { Course: '↗', Musculation: '⬡', Vélo: '⌁', Natation: '≈', Yoga: '✳', Autre: '✦' }[type];
  }

  private emptyWorkout(): Omit<Workout, 'id'> {
    return {
      type: 'Course',
      durationMinutes: 30,
      caloriesBurned: 250,
      date: this.dateInputValue(this.today),
      notes: '',
    };
  }

  private emptyGoal(): Omit<FitnessGoal, 'id' | 'status'> {
    const deadline = new Date(this.today);
    deadline.setMonth(deadline.getMonth() + 2);
    return {
      title: '',
      startValue: 73,
      targetValue: 70,
      currentValue: 73,
      unit: 'kg',
      deadline: this.dateInputValue(deadline),
    };
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'object' && error.error !== null) {
        const body = error.error as { message?: unknown; error?: unknown; detail?: unknown };
        if (typeof body.message === 'string') return body.message;
        if (typeof body.error === 'string') return body.error;
        if (typeof body.detail === 'string') return body.detail;
      }
      if (error.status === 0)
        return 'Le serveur est injoignable. Vérifiez que les services sont démarrés.';
      if (error.status === 502 || error.status === 503 || error.status === 504)
        return 'L’API n’est pas démarrée. Démarrez MySQL, puis les services Spring Boot et la passerelle API.';
      return `La requête a échoué (HTTP ${error.status}).`;
    }
    return 'Une erreur inattendue est survenue.';
  }

  private startOfWeek(date: Date): Date {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start;
  }

  private endOfToday(): Date {
    return new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      this.today.getDate(),
      23,
      59,
      59,
    );
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private dateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
