package fr.forma.fitness;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface GoalRepository extends JpaRepository<GoalEntity, Long> {
    List<GoalEntity> findAllByUserIdOrderByDeadlineAsc(Long userId);
    Optional<GoalEntity> findByIdAndUserId(Long id, Long userId);
}
