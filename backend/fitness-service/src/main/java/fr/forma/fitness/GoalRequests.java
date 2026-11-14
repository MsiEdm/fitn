package fr.forma.fitness;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

final class GoalRequests {
    private GoalRequests() {}

    record Save(
            @NotBlank @Size(max = 80) String title,
            @DecimalMin("0.0") @DecimalMax("1000000.0") double startValue,
            @DecimalMin("0.1") @DecimalMax("1000000.0") double targetValue,
            @DecimalMin("0.0") @DecimalMax("1000000.0") double currentValue,
            @NotBlank @Size(max = 12) String unit,
            @NotNull LocalDate deadline) {}
}
