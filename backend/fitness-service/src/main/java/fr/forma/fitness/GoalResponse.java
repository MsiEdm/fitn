package fr.forma.fitness;

import java.time.LocalDate;

record GoalResponse(Long id, String title, double startValue, double targetValue,
                    double currentValue, String unit, LocalDate deadline, String status) {
    static GoalResponse from(GoalEntity goal) {
        return new GoalResponse(goal.getId(), goal.getTitle(), goal.getStartValue(), goal.getTargetValue(),
                goal.getCurrentValue(), goal.getUnit(), goal.getDeadline(), goal.getStatus());
    }
}
