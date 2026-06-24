package com.enterprise.taskmanager.config;

import com.enterprise.taskmanager.model.ActivityLog;
import com.enterprise.taskmanager.model.SubTask;
import com.enterprise.taskmanager.model.SystemSetting;
import com.enterprise.taskmanager.model.Task;
import com.enterprise.taskmanager.model.User;
import com.enterprise.taskmanager.repository.ActivityLogRepository;
import com.enterprise.taskmanager.repository.SettingRepository;
import com.enterprise.taskmanager.repository.TaskRepository;
import com.enterprise.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private SettingRepository settingRepository;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Users if empty
        if (userRepository.count() == 0) {
            userRepository.saveAll(Arrays.asList(
                new User(null, "Alex Rivera", "alex.rivera@enterprise.com", "Engineering", "Admin", true),
                new User(null, "Jane Doe", "jane.doe@enterprise.com", "Design", "Contributor", true),
                new User(null, "Devon Carter", "devon.carter@enterprise.com", "Product", "Manager", true),
                new User(null, "Sophia Chen", "sophia.chen@enterprise.com", "Marketing", "Contributor", false)
            ));
        }

        // 2. Seed Settings if empty
        if (settingRepository.count() == 0) {
            settingRepository.saveAll(Arrays.asList(
                new SystemSetting("maintenance", "false"),
                new SystemSetting("allow-create", "true"),
                new SystemSetting("archive-days", "90")
            ));
        }

        // 3. Seed Tasks if empty
        if (taskRepository.count() == 0) {
            taskRepository.save(new Task(
                null, 
                "Revise database configuration values", 
                "high", 
                "2026-06-25", 
                "Ensure maximum connection limits are increased to 100 for dev testing.", 
                "todo", 
                Arrays.asList("Backend", "Config"),
                Collections.singletonList(new SubTask("Verify connection pool setting", false))
            ));
            
            taskRepository.save(new Task(
                null, 
                "Deploy staging build to AWS ECS cluster", 
                "medium", 
                "2026-06-26", 
                "Verify task definitions and docker tag configurations are active.", 
                "todo", 
                Arrays.asList("DevOps", "Cloud"),
                Collections.emptyList()
            ));

            taskRepository.save(new Task(
                null, 
                "Design new landing hero layouts", 
                "low", 
                "2026-06-28", 
                "Draft interactive modules sections with vibrant glassmorphic previews.", 
                "in-progress", 
                Collections.singletonList("Design"),
                Arrays.asList(new SubTask("Draft mockup layouts", true), new SubTask("Select core typography assets", false))
            ));

            taskRepository.save(new Task(
                null, 
                "Write unit tests for authentication helpers", 
                "high", 
                "2026-06-22", 
                "Build mock testing suites validating JWT signatures and session decoders.", 
                "done", 
                Arrays.asList("Testing", "Security"),
                Collections.singletonList(new SubTask("Write security key parser tests", true))
            ));
            
            taskRepository.save(new Task(
                null, 
                "Setup CORS policy on API gateways", 
                "medium", 
                "2026-06-23", 
                "Configure endpoints headers to allow wildcard pattern mappings.", 
                "done", 
                Collections.singletonList("Backend"),
                Collections.emptyList()
            ));

            taskRepository.save(new Task(
                null, 
                "Create Docker Compose file", 
                "high", 
                "2026-06-25", 
                "Build orchestration script mapping postgres DB, Java backend, and Nginx frontend.", 
                "in-progress", 
                Arrays.asList("Docker", "DevOps"),
                Collections.emptyList()
            ));
        }

        // 4. Seed Activity Logs if empty
        if (activityLogRepository.count() == 0) {
            activityLogRepository.saveAll(Arrays.asList(
                new ActivityLog(null, "done", "Completed task: Write unit tests for authentication helpers", LocalDateTime.now().minusHours(2)),
                new ActivityLog(null, "add", "Created task: Revise database configuration values", LocalDateTime.now().minusHours(4)),
                new ActivityLog(null, "admin", "Role updated: Jane Doe set to Project Contributor", LocalDateTime.now().minusDays(1)),
                new ActivityLog(null, "done", "Completed task: Setup CORS policy on API gateways", LocalDateTime.now().minusDays(1))
            ));
        }
    }
}
