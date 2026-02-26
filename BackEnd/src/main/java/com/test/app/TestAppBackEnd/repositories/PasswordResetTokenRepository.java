package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByUsername(String username);
}
