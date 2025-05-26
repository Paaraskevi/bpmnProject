package com.jts.BpmnJava.FileService;

import com.jts.BpmnJava.RepoFile.RepoFile;
import com.jts.BpmnJava.model.File;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.List;
@Service

public class FileService {
    private final RepoFile repoFile;
    private Path foundFile;

    public FileService(RepoFile repoFile) {
        this.repoFile = repoFile;
    }
    public List<File> getAllFiles() {
        return repoFile.findAll();
    }
    public File findFileByFilename(String filename) {
        return repoFile.findByFileName(filename)
                .orElseThrow(() -> new RuntimeException("File with filename " + filename + " not found"));
    }
    public void deleteByFile(Long id) {
        repoFile.deleteById(id);
    }

    public File findFileById(Long id) {
        return repoFile.findById(id)
                .orElseThrow(() -> new RuntimeException("File with ID " + id + " not found"));
    }
}
