package bpmnProject.akon.bpmnJavaBackend.Settings;

import bpmnProject.akon.bpmnJavaBackend.DtoClasses.*;
import bpmnProject.akon.bpmnJavaBackend.User.User;
import bpmnProject.akon.bpmnJavaBackend.User.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;

@Service
@RequiredArgsConstructor
public class SettingsService {
    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferencesRepository;
    private final UserSecuritySettingsRepository userSecuritySettingsRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserSettingsDto getUserSettings(Principal connectedUser) {
        var user = (User) ((UsernamePasswordAuthenticationToken) connectedUser).getPrincipal();
        var userWithDetails = userRepository.findByEmailOrUsernameWithRoles(user.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get or create user preferences
        UserPreferences preferences = userPreferencesRepository.findByUserId(userWithDetails.getId())
                .orElse(createDefaultPreferences(userWithDetails));

        // Get or create security settings
        UserSecuritySettings securitySettings = userSecuritySettingsRepository.findByUserId(userWithDetails.getId())
                .orElse(createDefaultSecuritySettings(userWithDetails));

        return UserSettingsDto.builder()
                .profile(convertToUserDto(userWithDetails, preferences))
                .preferences(convertToPreferencesDto(preferences))
                .security(convertToSecurityDto(securitySettings))
                .settings(SettingsDto.builder().activeTab("profile").build())
                .build();
    }

    @Transactional
    public UserDto updateProfile(UserDto profileDto, Principal connectedUser) {
        var user = (User) ((UsernamePasswordAuthenticationToken) connectedUser).getPrincipal();
        var userToUpdate = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update user profile fields
        userToUpdate.setFirstname(profileDto.getFirstName());
        userToUpdate.setLastname(profileDto.getLastName());
        userToUpdate.setEmail(profileDto.getEmail());

        // Save updated user
        User savedUser = userRepository.save(userToUpdate);

        // Update or create user preferences for additional profile fields
        UserPreferences preferences = userPreferencesRepository.findByUserId(savedUser.getId())
                .orElse(createDefaultPreferences(savedUser));

        preferences.setAddress(profileDto.getAddress());
        preferences.setPhone(profileDto.getPhone());
        preferences.setProfilePicture(profileDto.getProfilePicture());

        userPreferencesRepository.save(preferences);

        return convertToUserDto(savedUser, preferences);
    }

    @Transactional
    public PreferencesDto updatePreferences(PreferencesDto preferencesDto, Principal connectedUser) {
        var user = (User) ((UsernamePasswordAuthenticationToken) connectedUser).getPrincipal();

        UserPreferences preferences = userPreferencesRepository.findByUserId(user.getId())
                .orElse(createDefaultPreferences(user));

        // Update preferences
        preferences.setTheme(preferencesDto.getTheme());
        preferences.setLanguage(preferencesDto.getLanguage());
        preferences.setTimezone(preferencesDto.getTimezone());
        preferences.setDateFormat(preferencesDto.getDateFormat());
        preferences.setEmailNotifications(preferencesDto.getNotifications().getEmail());
        preferences.setInAppNotifications(preferencesDto.getNotifications().getInApp());
        preferences.setPushNotifications(preferencesDto.getNotifications().getPush());

        UserPreferences savedPreferences = userPreferencesRepository.save(preferences);
        return convertToPreferencesDto(savedPreferences);
    }

    @Transactional
    public SecuritySettingsDto updateSecurity(SecuritySettingsDto securityDto, Principal connectedUser) {
        var user = (User) ((UsernamePasswordAuthenticationToken) connectedUser).getPrincipal();

        UserSecuritySettings securitySettings = userSecuritySettingsRepository.findByUserId(user.getId())
                .orElse(createDefaultSecuritySettings(user));

        // Update security settings
        securitySettings.setTwoFactorAuth(securityDto.getTwoFactorAuth());
        securitySettings.setSessionTimeout(securityDto.getSessionTimeout());
        securitySettings.setLoginNotifications(securityDto.getLoginNotifications());

        UserSecuritySettings savedSettings = userSecuritySettingsRepository.save(securitySettings);
        return convertToSecurityDto(savedSettings);
    }

    @Transactional
    public void changePassword(ChangePasswordDto passwordDto, Principal connectedUser) {
        var user = (User) ((UsernamePasswordAuthenticationToken) connectedUser).getPrincipal();
        var userToUpdate = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(passwordDto.getCurrentPassword(), userToUpdate.getPassword())) {
            throw new IllegalStateException("Current password is incorrect");
        }

        // Verify new passwords match
        if (!passwordDto.getNewPassword().equals(passwordDto.getConfirmPassword())) {
            throw new IllegalStateException("New passwords do not match");
        }

        // Update password
        userToUpdate.setPassword(passwordEncoder.encode(passwordDto.getNewPassword()));
        userRepository.save(userToUpdate);
    }

    // Helper methods
    private UserPreferences createDefaultPreferences(User user) {
        return UserPreferences.builder()
                .user(user)
                .theme("light")
                .language("en")
                .timezone("UTC")
                .dateFormat("MM/DD/YYYY")
                .emailNotifications(true)
                .inAppNotifications(true)
                .pushNotifications(true)
                .address("")
                .phone("")
                .profilePicture("")
                .build();
    }

    private UserSecuritySettings createDefaultSecuritySettings(User user) {
        return UserSecuritySettings.builder()
                .user(user)
                .twoFactorAuth(false)
                .sessionTimeout(30)
                .loginNotifications(false)
                .build();
    }

    private UserDto convertToUserDto(User user, UserPreferences preferences) {
        return UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstname())
                .lastName(user.getLastname())
                .email(user.getEmail())
                .address(preferences.getAddress())
                .phone(preferences.getPhone())
                .profilePicture(preferences.getProfilePicture())
                .build();
    }

    private PreferencesDto convertToPreferencesDto(UserPreferences preferences) {
        NotificationsDto notifications = NotificationsDto.builder()
                .email(preferences.getEmailNotifications())
                .inApp(preferences.getInAppNotifications())
                .push(preferences.getPushNotifications())
                .build();

        return PreferencesDto.builder()
                .theme(preferences.getTheme())
                .language(preferences.getLanguage())
                .timezone(preferences.getTimezone())
                .dateFormat(preferences.getDateFormat())
                .notifications(notifications)
                .build();
    }

    private SecuritySettingsDto convertToSecurityDto(UserSecuritySettings settings) {
        return SecuritySettingsDto.builder()
                .twoFactorAuth(settings.getTwoFactorAuth())
                .sessionTimeout(settings.getSessionTimeout())
                .loginNotifications(settings.getLoginNotifications())
                .build();
    }
}