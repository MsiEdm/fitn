package fr.forma.fitness;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.Locale;

@Entity
@Table(name = "workouts")
class WorkoutEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 30)
    private String type;
    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;
    @Column(name = "calories_burned", nullable = false)
    private int caloriesBurned;
    @Column(name = "workout_date", nullable = false)
    private LocalDate date;
    @Column(length = 280)
    private String notes;
    @Column(name = "user_id", nullable = false)
    private Long userId;

    protected WorkoutEntity() {}

    WorkoutEntity(WorkoutRequests.Save request, Long userId) {
        update(request);
        this.userId = userId;
    }

    void update(WorkoutRequests.Save request) {
        type = request.type().trim().toUpperCase(Locale.ROOT);
        durationMinutes = request.durationMinutes();
        caloriesBurned = request.caloriesBurned();
        date = request.date();
        notes = request.notes() == null ? "" : request.notes().trim();
    }

    Long getId() { return id; }
    String getType() { return type; }
    int getDurationMinutes() { return durationMinutes; }
    int getCaloriesBurned() { return caloriesBurned; }
    LocalDate getDate() { return date; }
    String getNotes() { return notes; }
    Long getUserId() { return userId; }
}
