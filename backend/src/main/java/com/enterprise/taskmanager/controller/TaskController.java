package com.enterprise.taskmanager.controller;

import com.enterprise.taskmanager.model.ActivityLog;
import com.enterprise.taskmanager.model.Task;
import com.enterprise.taskmanager.repository.ActivityLogRepository;
import com.enterprise.taskmanager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        Task saved = taskRepository.save(task);
        
        // Log activity
        logActivity("add", "Created task: " + saved.getTitle());
        return saved;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id)
                .map(task -> {
                    String oldCol = task.getColumn();
                    String newCol = taskDetails.getColumn();
                    
                    task.setTitle(taskDetails.getTitle());
                    task.setPriority(taskDetails.getPriority());
                    task.setDate(taskDetails.getDate());
                    task.setDescription(taskDetails.getDescription());
                    task.setColumn(taskDetails.getColumn());
                    task.setTags(taskDetails.getTags());
                    task.setSubtasks(taskDetails.getSubtasks());
                    
                    Task updated = taskRepository.save(task);
                    
                    // Log movement
                    if (oldCol != null && !oldCol.equals(newCol)) {
                        String friendlyOld = getFriendlyColumnName(oldCol);
                        String friendlyNew = getFriendlyColumnName(newCol);
                        logActivity(newCol.equals("done") ? "done" : "add", 
                                "Moved task \"" + updated.getTitle() + "\" to " + friendlyNew);
                    } else {
                        logActivity("add", "Updated task: " + updated.getTitle());
                    }
                    
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(task -> {
                    taskRepository.delete(task);
                    logActivity("admin", "Deleted task: " + task.getTitle());
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

    private String getFriendlyColumnName(String col) {
        if ("todo".equals(col)) return "To Do";
        if ("in-progress".equals(col)) return "In Progress";
        if ("in-review".equals(col)) return "In Review";
        if ("done".equals(col)) return "Done";
        return col;
    }
}
