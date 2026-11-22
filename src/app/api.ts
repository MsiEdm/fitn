import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';

export type WorkoutType = 'Course' | 'Musculation' | 'Vélo' | 'Natation' | 'Yoga' | 'Autre';

export interface Workout {
  id: string;
  type: WorkoutType;
  durationMinutes: number;
  caloriesBurned: number;
  date: string;
  notes: string;
}

export interface FitnessGoal {
  id: string;
  title: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  status: string;
}

export interface WeeklyStats {
  weekStart: string;
  workoutsCount: number;
  totalDurationMinutes: number;
  totalCaloriesBurned: number;
  daily: Array<{
    date: string;
    workoutsCount: number;
    durationMinutes: number;
    caloriesBurned: number;
  }>;
}

interface WorkoutRow {
  id: string;
  type: string;
  duration_minutes: number;
  calories_burned: number;
  workout_date: string;
  notes: string | null;
}

interface GoalRow {
  id: string;
  title: string;
  start_value: number;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
}

const workoutToDatabase: Record<WorkoutType, string> = {
  Course: 'COURSE',
  Musculation: 'STRENGTH',
  Vélo: 'CYCLING',
  Natation: 'SWIMMING',
  Yoga: 'YOGA',
  Autre: 'OTHER',
};

const workoutFromDatabase: Record<string, WorkoutType> = {
  COURSE: 'Course',
  RUNNING: 'Course',
  STRENGTH: 'Musculation',
  MUSCULATION: 'Musculation',
  CYCLING: 'Vélo',
  VELO: 'Vélo',
  SWIMMING: 'Natation',
  NATATION: 'Natation',
  YOGA: 'Yoga',
  OTHER: 'Autre',
  AUTRE: 'Autre',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly token = signal<string | null>(null);
  readonly username = signal('');
  readonly isAuthenticated = computed(() => this.token() !== null);

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.token.set(session?.access_token ?? null);
      this.username.set(
        String(session?.user.user_metadata['username'] ?? session?.user.email ?? ''),
      );
    });
  }

  register(username: string, email: string, password: string): Observable<void> {
    return from(this.supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) {
          throw new Error('Cette adresse e-mail possède déjà un compte. Connectez-vous avec ce compte.');
        }
      }),
    );
  }

  verifyEmailCode(email: string, code: string): Observable<void> {
    return from(this.supabase.auth.verifyOtp({ email, token: code, type: 'email' })).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  resendEmailCode(email: string): Observable<void> {
    return from(this.supabase.auth.resend({ type: 'signup', email })).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  login(email: string, password: string): Observable<void> {
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  logout(): void {
    this.token.set(null);
    this.username.set('');
    void this.supabase.auth.signOut();
  }
}

@Injectable({ providedIn: 'root' })
export class FitnessApi {
  private readonly supabase = inject(SupabaseService).client;

  getWorkouts(): Observable<Workout[]> {
    return from(
      this.supabase.from('workouts').select('*').order('workout_date', { ascending: false }),
    ).pipe(map(({ data, error }) => {
      if (error) throw error;
      return ((data ?? []) as WorkoutRow[]).map((row) => this.toWorkout(row));
    }));
  }

  getWorkout(id: string): Observable<Workout> {
    return from(this.supabase.from('workouts').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toWorkout(data as WorkoutRow);
      }),
    );
  }

  createWorkout(workout: Omit<Workout, 'id'>): Observable<Workout> {
    return from(this.supabase.from('workouts').insert(this.workoutPayload(workout)).select('*').single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toWorkout(data as WorkoutRow);
      }),
    );
  }

  updateWorkout(id: string, workout: Omit<Workout, 'id'>): Observable<Workout> {
    return from(
      this.supabase.from('workouts').update(this.workoutPayload(workout)).eq('id', id).select('*').single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toWorkout(data as WorkoutRow);
      }),
    );
  }

  deleteWorkout(id: string): Observable<void> {
    return from(this.supabase.from('workouts').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getGoals(): Observable<FitnessGoal[]> {
    return from(this.supabase.from('goals').select('*').order('deadline')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return ((data ?? []) as GoalRow[]).map((row) => this.toGoal(row));
      }),
    );
  }

  createGoal(goal: Omit<FitnessGoal, 'id' | 'status'>): Observable<FitnessGoal> {
    return from(this.supabase.from('goals').insert(this.goalPayload(goal)).select('*').single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toGoal(data as GoalRow);
      }),
    );
  }

  updateGoal(id: string, goal: Omit<FitnessGoal, 'id' | 'status'>): Observable<FitnessGoal> {
    return from(
      this.supabase.from('goals').update(this.goalPayload(goal)).eq('id', id).select('*').single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toGoal(data as GoalRow);
      }),
    );
  }

  deleteGoal(id: string): Observable<void> {
    return from(this.supabase.from('goals').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getWeeklyStats(): Observable<WeeklyStats> {
    return this.getWorkouts().pipe(map((workouts) => {
      const today = new Date();
      const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const weekStart = this.dateValue(monday);
      const weekEnd = this.dateValue(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6));
      const weekly = workouts.filter((workout) => workout.date >= weekStart && workout.date <= weekEnd);
      const daily = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
        const dateValue = this.dateValue(date);
        const dayWorkouts = weekly.filter((workout) => workout.date === dateValue);
        return {
          date: dateValue,
          workoutsCount: dayWorkouts.length,
          durationMinutes: dayWorkouts.reduce((total, workout) => total + workout.durationMinutes, 0),
          caloriesBurned: dayWorkouts.reduce((total, workout) => total + workout.caloriesBurned, 0),
        };
      });
      return {
        weekStart,
        workoutsCount: weekly.length,
        totalDurationMinutes: daily.reduce((total, day) => total + day.durationMinutes, 0),
        totalCaloriesBurned: daily.reduce((total, day) => total + day.caloriesBurned, 0),
        daily,
      };
    }));
  }

  private workoutPayload(workout: Omit<Workout, 'id'>) {
    return {
      type: workoutToDatabase[workout.type],
      duration_minutes: workout.durationMinutes,
      calories_burned: workout.caloriesBurned,
      workout_date: workout.date,
      notes: workout.notes,
    };
  }

  private goalPayload(goal: Omit<FitnessGoal, 'id' | 'status'>) {
    return {
      title: goal.title,
      start_value: goal.startValue,
      target_value: goal.targetValue,
      current_value: goal.currentValue,
      unit: goal.unit,
      deadline: goal.deadline,
    };
  }

  private toWorkout(row: WorkoutRow): Workout {
    return {
      id: row.id,
      type: workoutFromDatabase[row.type] ?? 'Autre',
      durationMinutes: row.duration_minutes,
      caloriesBurned: row.calories_burned,
      date: row.workout_date,
      notes: row.notes ?? '',
    };
  }

  private toGoal(row: GoalRow): FitnessGoal {
    return {
      id: row.id,
      title: row.title,
      startValue: Number(row.start_value),
      targetValue: Number(row.target_value),
      currentValue: Number(row.current_value),
      unit: row.unit,
      deadline: row.deadline,
      status: row.current_value === row.target_value
        ? 'COMPLETED'
        : row.deadline < this.dateValue(new Date()) ? 'OVERDUE' : 'IN_PROGRESS',
    };
  }

  private dateValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
