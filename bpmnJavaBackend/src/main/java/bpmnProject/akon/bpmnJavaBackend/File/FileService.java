package bpmnProject.akon.bpmnJavaBackend.File;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ResolvableType;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FileService {
    private final FileRepository fileRepo;
    private ResolvableType FileService;
    private Path foundFile;

    @Autowired
    public FileService(FileRepository fileRepo){
        this.fileRepo = fileRepo;
    }

    public File uploadFile(File file){
        file.setUploadTime(LocalDateTime.now());
        return fileRepo.save(file);
    }

    public List<File> getAllFiles() {
        return fileRepo.findAll();
    }

    /**
     * This method finds sth..
     *
     * @param filename String the name of a file
     * @return returns...
     */
    public File findFileByFilename(String filename) {
        return fileRepo.findByFileName(filename)
                .orElseThrow(() -> new RuntimeException("File with filename " + filename + " not found"));
    }
    public void deleteByFile(Long id) {
        fileRepo.deleteById(id);
    }

    public File findFileById(Long id) {
        return fileRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("File with ID " + id + " not found"));
    }

    public byte[] convertBpmnToPdf(File file) {
        System.out.println("Converting BPMN file at " );

        return null;
    }
}
