package com.test.app.TestAppBackEnd.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.test.app.TestAppBackEnd.services.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public JwtFilter(JwtUtil jwtUtil,
                     CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    /*
     * Skip JWT validation for public endpoints
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        return path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.startsWith("/public");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // No token → continue (Spring Security will handle protected endpoints)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            // Validate token first
            if (!jwtUtil.isTokenValid(token)) {
                sendUnauthorized(response, "Invalid or expired token");
                return;
            }

            // Extract username
            String username = jwtUtil.extractUsername(token);

            if (username != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                var userDetails = userDetailsService.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                SecurityContextHolder.getContext().setAuthentication(auth);

                logger.info("Authenticated user: {}", username);
            }

            filterChain.doFilter(request, response);

        } catch (io.jsonwebtoken.ExpiredJwtException e) {

            logger.warn("JWT token expired: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            sendUnauthorized(response, "Token expired");

        } catch (Exception e) {

            logger.error("JWT validation error", e);
            SecurityContextHolder.clearContext();
            sendUnauthorized(response, "Invalid token");
        }
    }

    /*
     * JSON error response (Android friendly)
     */
    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");

        Map<String, Object> body = Map.of(
                "message", message,
                "status", 401,
                "success", false
        );

        new ObjectMapper().writeValue(response.getOutputStream(), body);
    }
}