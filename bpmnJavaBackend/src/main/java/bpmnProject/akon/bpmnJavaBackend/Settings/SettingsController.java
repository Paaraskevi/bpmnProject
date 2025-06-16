package bpmnProject.akon.bpmnJavaBackend.Settings;

import bpmnProject.akon.bpmnJavaBackend.DtoClasses.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/user")
    public ResponseEntity<UserSettingsDto> getUserSettings(Principal connectedUser) {
        UserSettingsDto settings = settingsService.getUserSettings(connectedUser);
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(
            @RequestBody UserDto userDto,
            Principal connectedUser
    ) {
        UserDto updatedUser = settingsService.updateProfile(userDto, connectedUser);
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/preferences")
    @PreAuthorize("hasAnyRole('ROLE_MODELER', 'ROLE_ADMIN')")
    public ResponseEntity<PreferencesDto> updatePreferences(
            @RequestBody PreferencesDto preferencesDto,
            Principal connectedUser
    ) {
        PreferencesDto updatedPreferences = settingsService.updatePreferences(preferencesDto, connectedUser);
        return ResponseEntity.ok(updatedPreferences);
    }

    @PutMapping("/security")
    public ResponseEntity<SecuritySettingsDto> updateSecurity(
            @RequestBody SecuritySettingsDto securityDto,
            Principal connectedUser
    ) {
        SecuritySettingsDto updatedSecurity = settingsService.updateSecurity(securityDto, connectedUser);
        return ResponseEntity.ok(updatedSecurity);
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordDto passwordDto,
            Principal connectedUser
    ) {
        settingsService.changePassword(passwordDto, connectedUser);
        return ResponseEntity.ok().build();
    }
}