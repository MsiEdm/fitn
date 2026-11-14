package fr.forma.fitness;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface WorkoutRepository extends JpaRepository<WorkoutEntity, Long> {
    List<WorkoutEntity> findAllByUserIdOrderByDateDescIdDesc(Long userId);
    Optional<WorkoutEntity> findByIdAndUserId(Long id, Long userId);
}
