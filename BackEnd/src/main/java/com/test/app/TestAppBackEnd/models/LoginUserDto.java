package com.test.app.TestAppBackEnd.models;

import com.test.app.TestAppBackEnd.constants.Role;
import com.test.app.TestAppBackEnd.entities.UserProfile;

import java.util.Set;

/**
 * User data returned in login response for frontend compatibility.
 */
public class LoginUserDto {
    private String id;
    private String username;
    private String email;
    private String name;
    private String phone;
    private String userType; // "customer" | "mechanic" | "admin" | "carwash"

    public static LoginUserDto fromUserProfile(UserProfile profile) {
        LoginUserDto dto = new LoginUserDto();
        dto.setId(profile.getId() != null ? String.valueOf(profile.getId()) : null);
        dto.setUsername(profile.getUsername());
        dto.setEmail(profile.getEmail());
        String fullName = (profile.getFirstName() != null ? profile.getFirstName() : "") + " " +
                (profile.getLastName() != null ? profile.getLastName() : "");
        dto.setName(fullName.trim().isEmpty() ? profile.getUsername() : fullName.trim());
        dto.setPhone(profile.getPhoneNumber());
        dto.setUserType(resolveUserType(profile.getRoles()));
        return dto;
    }

    private static String resolveUserType(Set<Role> roles) {
        if (roles == null || roles.isEmpty()) return "customer";
        if (roles.contains(Role.ADMIN)) return "admin";
        if (roles.contains(Role.MECHANIC)) return "mechanic";
        if (roles.contains(Role.CARWASH)) return "carwash";
        if (roles.contains(Role.CLIENT)) return "customer";
        return "customer";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
}
