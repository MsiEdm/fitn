package fr.forma.statistics;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.http.HttpStatus;
import jakarta.servlet.http.HttpServletRequest;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

record WorkoutSnapshot(Long id, String type, int durationMinutes, int caloriesBurned, LocalDate date, String notes) {}
record GoalSnapshot(Long id, String title, double targetValue, double currentValue, LocalDate deadline, String status) {}
record DailyStats(LocalDate date, int workoutsCount, int durationMinutes, int caloriesBurned) {}
record WeeklyStats(LocalDate weekStart, int workoutsCount, int totalDurationMinutes, int totalCaloriesBurned,
                   List<DailyStats> daily) {}
record SummaryStats(int totalWorkouts, int totalDurationMinutes, int totalCaloriesBurned, int activeGoals) {}

@Service
class FitnessSnapshotClient {
    private final RestClient client;

    FitnessSnapshotClient(@Value("${fitness.service.url}") String serviceUrl, RestClient.Builder builder) {
        client = builder.baseUrl(serviceUrl).build();
    }

    List<WorkoutSnapshot> getWorkouts() {
        return client.get().uri("/api/workouts").headers(this::forwardAuthorization)
                .retrieve().body(new ParameterizedTypeReference<>() {});
    }

    List<GoalSnapshot> getGoals() {
        return client.get().uri("/api/goals").headers(this::forwardAuthorization)
                .retrieve().body(new ParameterizedTypeReference<>() {});
    }

    private void forwardAuthorization(HttpHeaders headers) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes == null ? null : attributes.getRequest();
        String authorization = request == null ? null : request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Accès non autorisé.");
        }
        headers.set(HttpHeaders.AUTHORIZATION, authorization);
    }
}

@RestController
@RequestMapping("/api/stats")
class StatisticsController {
    private final FitnessSnapshotClient fitness;

    StatisticsController(FitnessSnapshotClient fitness) {
        this.fitness = fitness;
    }

    @GetMapping("/summary")
    SummaryStats summary(@AuthenticationPrincipal Jwt jwt) {
        List<WorkoutSnapshot> workouts = fitness.getWorkouts();
        int duration = workouts.stream().mapToInt(WorkoutSnapshot::durationMinutes).sum();
        int calories = workouts.stream().mapToInt(WorkoutSnapshot::caloriesBurned).sum();
        int activeGoals = (int) fitness.getGoals().stream()
                .filter(goal -> !"COMPLETED".equals(goal.status())).count();
        return new SummaryStats(workouts.size(), duration, calories, activeGoals);
    }

    @GetMapping("/weekly")
    WeeklyStats weekly(@AuthenticationPrincipal Jwt jwt) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.with(DayOfWeek.MONDAY);
        List<WorkoutSnapshot> workouts = fitness.getWorkouts().stream()
                .filter(workout -> !workout.date().isBefore(start) && !workout.date().isAfter(today))
                .toList();
        List<DailyStats> daily = start.datesUntil(start.plusDays(7)).map(date -> {
            List<WorkoutSnapshot> day = workouts.stream().filter(workout -> workout.date().equals(date)).toList();
            return new DailyStats(date, day.size(), day.stream().mapToInt(WorkoutSnapshot::durationMinutes).sum(),
                    day.stream().mapToInt(WorkoutSnapshot::caloriesBurned).sum());
        }).toList();
        return new WeeklyStats(start, workouts.size(),
                workouts.stream().mapToInt(WorkoutSnapshot::durationMinutes).sum(),
                workouts.stream().mapToInt(WorkoutSnapshot::caloriesBurned).sum(), daily);
    }
}
