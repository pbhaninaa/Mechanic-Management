package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.PasswordResetToken;
import com.test.app.TestAppBackEnd.entities.User;
import com.test.app.TestAppBackEnd.repositories.PasswordResetTokenRepository;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import com.test.app.TestAppBackEnd.repositories.UserRepository;
import com.test.app.TestAppBackEnd.config.FrontendUrlResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_BYTES = 32;
    private static final int EXPIRY_HOURS = 24;

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final FrontendUrlResolver frontendUrlResolver;

    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            FrontendUrlResolver frontendUrlResolver) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.frontendUrlResolver = frontendUrlResolver;
    }

    /**
     * Request password reset: lookup user by email, generate token, send email.
     * Always returns success (don't reveal if email exists).
     */
    @Transactional
    public void requestPasswordReset(String email) {
        Optional<String> usernameOpt = userProfileRepository.findByEmail(email)
                .map(u -> u.getUsername());
        if (usernameOpt.isEmpty())
            return;

        String username = usernameOpt.get();
        tokenRepository.deleteByUsername(username);

        String token = generateSecureToken();
        Instant expiry = Instant.now().plusSeconds(EXPIRY_HOURS * 3600L);
        PasswordResetToken resetToken = new PasswordResetToken(username, token, expiry);
        tokenRepository.save(resetToken);

        String baseUrl = frontendUrlResolver.getFrontendBaseUrl();
        String resetLink = baseUrl + "/reset-password?token=" + token;
        log.info("Password reset email: sending link to {} -> {}", email, resetLink);
        String subject = "Reset Your Password";

        // HTML email keeps the full URL in one clickable link (plain text can truncate when line wraps)
        String htmlBody = "<p>Hi,</p>"
                + "<p>You requested a password reset. Click the link below to set a new password:</p>"
                + "<p><a href=\"" + resetLink + "\">Reset Password</a></p>"
                + "<p>This link expires in " + EXPIRY_HOURS + " hours.</p>"
                + "<p>If you did not request this, please ignore this email.</p>"
                + "<p>Best regards,<br>Mechanic App</p>";
        emailService.sendEmailNotification(email, subject, htmlBody, true);
    }

    /**
     * Reset password with token. Returns false if token invalid/expired.
     */
    @Transactional
    public boolean resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            return false;
        }
        token = token.trim();
        Optional<PasswordResetToken> opt = tokenRepository.findByToken(token);
        if (opt.isEmpty()) {
            log.warn("Reset password failed: token not found (len={})", token.length());
            return false;
        }
        if (opt.get().isExpired()) {
            log.warn("Reset password failed: token expired for user {}", opt.get().getUsername());
            return false;
        }

        PasswordResetToken resetToken = opt.get();
        Optional<User> userOpt = userRepository.findByUsername(resetToken.getUsername());
        if (userOpt.isEmpty())
            return false;

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(resetToken);
        return true;
    }

    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
