package fr.forma.fitness;

import java.time.LocalDate;

record WorkoutResponse(Long id, String type, int durationMinutes, int caloriesBurned, LocalDate date, String notes) {
    static WorkoutResponse from(WorkoutEntity workout) {
        return new WorkoutResponse(workout.getId(), workout.getType(), workout.getDurationMinutes(),
                workout.getCaloriesBurned(), workout.getDate(), workout.getNotes());
    }
}
