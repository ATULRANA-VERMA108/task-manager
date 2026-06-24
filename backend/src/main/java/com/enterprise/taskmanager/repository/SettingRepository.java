package com.enterprise.taskmanager.repository;

import com.enterprise.taskmanager.model.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettingRepository extends JpaRepository<SystemSetting, String> {
}
