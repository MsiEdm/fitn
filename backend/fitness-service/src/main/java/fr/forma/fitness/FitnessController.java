package fr.forma.fitness;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api")
class FitnessController {
    private final WorkoutRepository workouts;
    private final GoalRepository goals;

    FitnessController(WorkoutRepository workouts, GoalRepository goals) {
        this.workouts = workouts;
        this.goals = goals;
    }

    @GetMapping("/workouts")
    List<WorkoutResponse> listWorkouts(@AuthenticationPrincipal Jwt jwt) {
        return workouts.findAllByUserIdOrderByDateDescIdDesc(userId(jwt))
                .stream().map(WorkoutResponse::from).toList();
    }

    @GetMapping("/workouts/{id}")
    WorkoutResponse getWorkout(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return WorkoutResponse.from(findWorkout(id, userId(jwt)));
    }

    @PostMapping("/workouts")
    @ResponseStatus(HttpStatus.CREATED)
    WorkoutResponse createWorkout(@Valid @RequestBody WorkoutRequests.Save request,
                                  @AuthenticationPrincipal Jwt jwt) {
        return WorkoutResponse.from(workouts.save(new WorkoutEntity(request, userId(jwt))));
    }

    @PutMapping("/workouts/{id}")
    WorkoutResponse updateWorkout(@PathVariable Long id, @Valid @RequestBody WorkoutRequests.Save request,
                                  @AuthenticationPrincipal Jwt jwt) {
        WorkoutEntity workout = findWorkout(id, userId(jwt));
        workout.update(request);
        return WorkoutResponse.from(workouts.save(workout));
    }

    @DeleteMapping("/workouts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteWorkout(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        workouts.delete(findWorkout(id, userId(jwt)));
    }

    @GetMapping("/goals")
    List<GoalResponse> listGoals(@AuthenticationPrincipal Jwt jwt) {
        return goals.findAllByUserIdOrderByDeadlineAsc(userId(jwt))
                .stream().map(GoalResponse::from).toList();
    }

    @PostMapping("/goals")
    @ResponseStatus(HttpStatus.CREATED)
    GoalResponse createGoal(@Valid @RequestBody GoalRequests.Save request, @AuthenticationPrincipal Jwt jwt) {
        return GoalResponse.from(goals.save(new GoalEntity(request, userId(jwt))));
    }

    @PutMapping("/goals/{id}")
    GoalResponse updateGoal(@PathVariable Long id, @Valid @RequestBody GoalRequests.Save request,
                            @AuthenticationPrincipal Jwt jwt) {
        GoalEntity goal = findGoal(id, userId(jwt));
        goal.update(request);
        return GoalResponse.from(goals.save(goal));
    }

    @DeleteMapping("/goals/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteGoal(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        goals.delete(findGoal(id, userId(jwt)));
    }

    private WorkoutEntity findWorkout(Long id, Long userId) {
        return workouts.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Séance introuvable."));
    }

    private GoalEntity findGoal(Long id, Long userId) {
        return goals.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Objectif introuvable."));
    }

    private Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getClaims().get("userId").toString());
    }
}
