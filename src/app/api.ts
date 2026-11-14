import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

const API_BASE = '/api';
const TOKEN_KEY = 'forma-access-token';
const USER_KEY = 'forma-user-name';

export interface Workout {
  id: string;
  type: 'Course' | 'Musculation' | 'Vélo' | 'Natation' | 'Yoga' | 'Autre';
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

interface AuthResponse {
  accessToken: string;
  tokenType: string;
  username: string;
  email: string;
}

interface WorkoutResponse extends Omit<Workout, 'id' | 'type'> {
  id: number;
  type: string;
}

interface GoalResponse extends Omit<FitnessGoal, 'id'> {
  id: number;
}

const workoutToApi: Record<Workout['type'], string> = {
  Course: 'COURSE',
  Musculation: 'STRENGTH',
  Vélo: 'CYCLING',
  Natation: 'SWIMMING',
  Yoga: 'YOGA',
  Autre: 'OTHER',
};

const workoutFromApi: Record<string, Workout['type']> = {
  COURSE: 'Course',
  RUNNING: 'Course',
  STRENGTH: 'Musculation',
  CYCLING: 'Vélo',
  SWIMMING: 'Natation',
  YOGA: 'Yoga',
  OTHER: 'Autre',
};

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  return next(
    token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request,
  );
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly username = signal<string>(localStorage.getItem(USER_KEY) ?? '');
  readonly isAuthenticated = computed(() => this.token() !== null);

  constructor(private readonly http: HttpClient) {}

  register(username: string, email: string, password: string): Observable<void> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/register`, { username, email, password })
      .pipe(map((response) => this.saveSession(response)));
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/login`, { email, password })
      .pipe(map((response) => this.saveSession(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.username.set('');
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, response.username);
    this.token.set(response.accessToken);
    this.username.set(response.username);
  }
}

@Injectable({ providedIn: 'root' })
export class FitnessApi {
  constructor(private readonly http: HttpClient) {}

  getWorkouts(): Observable<Workout[]> {
    return this.http.get<WorkoutResponse[]>(`${API_BASE}/workouts`).pipe(
      map((items) =>
        items.map((item) => ({
          ...item,
          id: String(item.id),
          type: workoutFromApi[item.type] ?? 'Autre',
        })),
      ),
    );
  }

  getWorkout(id: string): Observable<Workout> {
    return this.http
      .get<WorkoutResponse>(`${API_BASE}/workouts/${encodeURIComponent(id)}`)
      .pipe(map((item) => this.toWorkout(item)));
  }

  createWorkout(workout: Omit<Workout, 'id'>): Observable<Workout> {
    return this.http
      .post<WorkoutResponse>(`${API_BASE}/workouts`, this.workoutPayload(workout))
      .pipe(map((item) => this.toWorkout(item)));
  }

  updateWorkout(id: string, workout: Omit<Workout, 'id'>): Observable<Workout> {
    return this.http
      .put<WorkoutResponse>(
        `${API_BASE}/workouts/${encodeURIComponent(id)}`,
        this.workoutPayload(workout),
      )
      .pipe(map((item) => this.toWorkout(item)));
  }

  deleteWorkout(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/workouts/${encodeURIComponent(id)}`);
  }

  getGoals(): Observable<FitnessGoal[]> {
    return this.http
      .get<GoalResponse[]>(`${API_BASE}/goals`)
      .pipe(map((items) => items.map((item) => ({ ...item, id: String(item.id) }))));
  }

  createGoal(goal: Omit<FitnessGoal, 'id' | 'status'>): Observable<FitnessGoal> {
    return this.http
      .post<GoalResponse>(`${API_BASE}/goals`, goal)
      .pipe(map((item) => ({ ...item, id: String(item.id) })));
  }

  updateGoal(id: string, goal: Omit<FitnessGoal, 'id' | 'status'>): Observable<FitnessGoal> {
    return this.http
      .put<GoalResponse>(`${API_BASE}/goals/${encodeURIComponent(id)}`, goal)
      .pipe(map((item) => ({ ...item, id: String(item.id) })));
  }

  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/goals/${encodeURIComponent(id)}`);
  }

  getWeeklyStats(): Observable<WeeklyStats> {
    return this.http.get<WeeklyStats>(`${API_BASE}/stats/weekly`);
  }

  private workoutPayload(
    workout: Omit<Workout, 'id'>,
  ): Omit<Workout, 'id' | 'type'> & { type: string } {
    return { ...workout, type: workoutToApi[workout.type] };
  }

  private toWorkout(item: WorkoutResponse): Workout {
    return {
      ...item,
      id: String(item.id),
      type: workoutFromApi[item.type] ?? 'Autre',
    };
  }
}
