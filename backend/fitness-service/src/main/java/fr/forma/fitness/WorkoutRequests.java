package fr.forma.fitness;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

final class WorkoutRequests {
    private WorkoutRequests() {}

    record Save(
            @NotBlank @Pattern(regexp = "(?i)COURSE|RUNNING|STRENGTH|MUSCULATION|SWIMMING|NATATION|CYCLING|VELO|VÉLO|YOGA|OTHER|AUTRE")
            String type,
            @Min(1) @Max(1440) int durationMinutes,
            @Min(0) @Max(10000) int caloriesBurned,
            @NotNull @jakarta.validation.constraints.PastOrPresent LocalDate date,
            @Size(max = 280) String notes) {}
}
