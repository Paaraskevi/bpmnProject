package com.jts.BpmnJava.FileController;

import com.jts.BpmnJava.FileService.FileService;
import com.jts.BpmnJava.model.File;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/file")
public class FileController {
    private final FileService fileService;
    public static final String DIRECTORY = String.format("%s\\Downloads", System.getProperty("user.home"));

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/all")
    public ResponseEntity<List<File>> getAllFiles() {
        return new ResponseEntity<>(fileService.getAllFiles(), HttpStatus.OK);
    }

    @GetMapping("/{filename}")
    public ResponseEntity<File> getFileByFilename(@PathVariable("filename") String filename) {
        File file = fileService.findFileByFilename(filename);
        return new ResponseEntity<>(file, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id) {
        fileService.deleteByFile(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
