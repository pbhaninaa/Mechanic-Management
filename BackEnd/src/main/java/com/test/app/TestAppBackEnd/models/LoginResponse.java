package com.test.app.TestAppBackEnd.models;

/**
 * Login response including token and user data for frontend compatibility.
 */
public class LoginResponse {

    private String accessToken;
    private String refreshToken;
    private boolean hasProfile;
    private LoginUserDto user;

    public LoginResponse(String accessToken, String refreshToken, boolean hasProfile) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.hasProfile = hasProfile;
    }

    public LoginResponse(String accessToken, String refreshToken, boolean hasProfile, LoginUserDto user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.hasProfile = hasProfile;
        this.user = user;
    }

    /** Alias for frontend - returns accessToken */
    public String getToken() {
        return accessToken;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public boolean isHasProfile() { return hasProfile; }
    public void setHasProfile(boolean hasProfile) { this.hasProfile = hasProfile; }

    public LoginUserDto getUser() { return user; }
    public void setUser(LoginUserDto user) { this.user = user; }
}
