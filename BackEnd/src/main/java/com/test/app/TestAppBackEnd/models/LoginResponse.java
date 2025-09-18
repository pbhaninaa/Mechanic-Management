package com.test.app.TestAppBackEnd.models;

public class LoginResponse {

    private String accessToken;
    private String refreshToken;
    private boolean hasProfile;
//    private UserProfile userProfile;

    public LoginResponse(String accessToken, String refreshToken, boolean hasProfile) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.hasProfile = hasProfile;
//        this.userProfile = userProfile;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public boolean isHasProfile() { return hasProfile; }
    public void setHasProfile(boolean hasProfile) { this.hasProfile = hasProfile; }
    /*public UserProfile getUserProfile() { return userProfile; }
    public void setUserProfile(UserProfile userProfile) { this.userProfile = userProfile; }*/
}
