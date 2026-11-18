package com.dayflow.user;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

  java.util.Optional<User> findByEmailIgnoreCase(String email);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query("select u from User u where u.id = :id")
  java.util.Optional<User> lockById(UUID id);
}
