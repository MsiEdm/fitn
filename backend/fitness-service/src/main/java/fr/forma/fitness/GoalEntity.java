package fr.forma.fitness;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "goals")
class GoalEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 80)
    private String title;
    @Column(name = "start_value", nullable = false)
    private double startValue;
    @Column(name = "target_value", nullable = false)
    private double targetValue;
    @Column(name = "current_value", nullable = false)
    private double currentValue;
    @Column(nullable = false, length = 12)
    private String unit;
    @Column(nullable = false)
    private LocalDate deadline;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(name = "user_id", nullable = false)
    private Long userId;

    protected GoalEntity() {}

    GoalEntity(GoalRequests.Save request, Long userId) {
        update(request);
        this.userId = userId;
    }

    void update(GoalRequests.Save request) {
        title = request.title().trim();
        startValue = request.startValue();
        targetValue = request.targetValue();
        currentValue = request.currentValue();
        unit = request.unit().trim();
        deadline = request.deadline();
        status = currentValue == targetValue ? "COMPLETED"
                : deadline.isBefore(LocalDate.now()) ? "OVERDUE" : "IN_PROGRESS";
    }

    Long getId() { return id; }
    String getTitle() { return title; }
    double getStartValue() { return startValue; }
    double getTargetValue() { return targetValue; }
    double getCurrentValue() { return currentValue; }
    String getUnit() { return unit; }
    LocalDate getDeadline() { return deadline; }
    String getStatus() { return status; }
}
