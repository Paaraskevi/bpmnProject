package com.jts.BpmnJava.repo;

import com.jts.BpmnJava.model.File;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RepoFile extends JpaRepository<File,Long> {
    Optional<File> findByFileName(String fileName);
    void deleteByFileName(String fileName);
}
