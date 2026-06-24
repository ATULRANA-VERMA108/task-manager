package com.enterprise.taskmanager.controller;

import com.enterprise.taskmanager.model.ActivityLog;
import com.enterprise.taskmanager.model.SystemSetting;
import com.enterprise.taskmanager.model.Task;
import com.enterprise.taskmanager.repository.ActivityLogRepository;
import com.enterprise.taskmanager.repository.SettingRepository;
import com.enterprise.taskmanager.repository.TaskRepository;
import com.enterprise.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class AnalyticsController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private SettingRepository settingRepository;

    @GetMapping("/analytics/activities")
    public List<ActivityLog> getRecentActivities() {
        // Return latest 10 activity logs
        return activityLogRepository.findAllByOrderByTimestampDesc()
                .stream()
                .limit(10)
                .collect(Collectors.toList());
    }

    @GetMapping("/analytics/summary")
    public Map<String, Object> getSummaryStats() {
        List<Task> tasks = taskRepository.findAll();
        long totalTasks = tasks.size();
        long inProgress = tasks.stream().filter(t -> "in-progress".equals(t.getColumn()) || "todo".equals(t.getColumn())).count();
        long completed = tasks.stream().filter(t -> "done".equals(t.getColumn())).count();
        long activeMembers = userRepository.findAll().stream().filter(u -> u.isActive()).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTasks", totalTasks);
        stats.put("inProgress", inProgress);
        stats.put("completed", completed);
        stats.put("activeMembers", activeMembers);
        return stats;
    }

    @GetMapping("/settings")
    public List<SystemSetting> getSettings() {
        return settingRepository.findAll();
    }

    @PostMapping("/settings")
    public ResponseEntity<Void> updateSettings(@RequestBody List<SystemSetting> settings) {
        settingRepository.saveAll(settings);
        
        // Log activity
        ActivityLog log = new ActivityLog();
        log.setType("admin");
        log.setDesc("Modified administration console parameters");
        log.setTimestamp(LocalDateTime.now());
        activityLogRepository.save(log);

        return ResponseEntity.ok().build();
    }
}
