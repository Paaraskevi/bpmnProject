package bpmnProject.akon.bpmnJavaBackend.File;

import jakarta.persistence.*;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Arrays;

@Table(name="files")
@RestController
@RequestMapping("/file")
@Entity

public class File implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String fileType;
    private Long fileSize;
    private String base64Data;

    @Lob
    private byte[] data;

    private LocalDateTime uploadTime;

    public File() {}

    public File(String fileName, String fileType, Long fileSize, byte[] data, LocalDateTime uploadTime) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.data = data;
        this.uploadTime = uploadTime;

    }

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }

    public LocalDateTime getUploadTime() { return uploadTime; }
    public void setUploadTime(LocalDateTime uploadTime) { this.uploadTime = uploadTime; }

    public String getBase64Data() {return base64Data;}
    public void setBase64Data(String base64Data) {this.base64Data = base64Data;}

    @Override
    public String toString() {
        return "File{" +
                "id=" + id +
                ", fileName='" + fileName + '\'' +
                ", fileType='" + fileType + '\'' +
                ", fileSize=" + fileSize +
                ", base64Data='" + base64Data + '\'' +
                ", data=" + Arrays.toString(data) +
                ", uploadTime=" + uploadTime +
                '}';
    }
}

