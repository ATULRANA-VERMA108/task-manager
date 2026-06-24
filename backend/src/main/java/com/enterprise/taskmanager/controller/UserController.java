package com.enterprise.taskmanager.controller;

import com.enterprise.taskmanager.model.ActivityLog;
import com.enterprise.taskmanager.model.User;
import com.enterprise.taskmanager.repository.ActivityLogRepository;
import com.enterprise.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        User saved = userRepository.save(user);
        logActivity("admin", "Added roster user: " + saved.getName());
        return saved;
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<User> toggleUserStatus(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setActive(!user.isActive());
                    User updated = userRepository.save(user);
                    logActivity("admin", "Toggled status for user: " + updated.getName());
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    logActivity("admin", "Deleted user account: " + user.getName());
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void logActivity(String type, String desc) {
        ActivityLog log = new ActivityLog();
        log.setType(type);
        log.setDesc(desc);
        log.setTimestamp(LocalDateTime.now());
        activityLogRepository.save(log);
    }
}
