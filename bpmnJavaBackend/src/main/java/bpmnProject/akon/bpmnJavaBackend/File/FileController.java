
package bpmnProject.akon.bpmnJavaBackend.File;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/file")
public class FileController {
    private final FileService fileService;
    public static final String DIRECTORY = System.getProperty("user.home") + java.io.File.separator + "Downloads";

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<File> uploadFile(@RequestParam("file") MultipartFile multipartFile) throws IOException {
        File file = new File();
        file.setFileName(multipartFile.getOriginalFilename());
        file.setFileType(multipartFile.getContentType());
        file.setFileSize(multipartFile.getSize());
        file.setData(multipartFile.getBytes());
        file.setUploadTime(LocalDateTime.now());

        File saved = fileService.uploadFile(file);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @GetMapping("/all")
    public ResponseEntity<List<File>> getAllFiles() {
        return new ResponseEntity<>(fileService.getAllFiles(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<File> getFileById(@PathVariable("id") Long id) {
        File file = fileService.findFileById(id);
        return new ResponseEntity<>(file, HttpStatus.OK);
    }

    @GetMapping("/file/{filename}")
    public ResponseEntity<File> getFileByFilename(@PathVariable("filename") String filename) {
        File file = fileService.findFileByFilename(filename);
        return new ResponseEntity<>(file, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id) {
        fileService.deleteByFile(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    // NEW: Export BPMN file as PDF
    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportFileToPdf(@PathVariable Long id) {
        try {
            File file = fileService.findFileById(id);
            if (file == null) {
                return ResponseEntity.notFound().build();
            }

            // Convert BPMN XML to PDF
            byte[] pdfBytes = fileService.convertBpmnToPdf(file);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment",
                    (file.getFileName() != null ? file.getFileName().replace(".bpmn", "") : "diagram") + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // NEW: Export BPMN file as PDF with custom metadata
    @PostMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportFileToPdfWithMetadata(
            @PathVariable Long id,
            @RequestBody Map<String, Object> metadata) {
        try {
            File file = fileService.findFileById(id);
            if (file == null) {
                return ResponseEntity.notFound().build();
            }

            // Convert BPMN XML to PDF with metadata
            byte[] pdfBytes = bpmnToPdfService.convertBpmnToPdfWithMetadata(file, metadata);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment",
                    (file.getFileName() != null ? file.getFileName().replace(".bpmn", "") : "diagram") + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // NEW: Export file in various formats
    @GetMapping("/{id}/export/{format}")
    public ResponseEntity<byte[]> exportFile(@PathVariable Long id, @PathVariable String format) {
        try {
            File file = fileService.findFileById(id);
            if (file == null) {
                return ResponseEntity.notFound().build();
            }

            byte[] exportedData;
            MediaType mediaType;
            String fileExtension;

            switch (format.toLowerCase()) {
                case "pdf":
                    exportedData = bpmnToPdfService.convertBpmnToPdf(file);
                    mediaType = MediaType.APPLICATION_PDF;
                    fileExtension = ".pdf";
                    break;
                case "svg":
                    exportedData = bpmnToPdfService.convertBpmnToSvg(file);
                    mediaType = MediaType.valueOf("image/svg+xml");
                    fileExtension = ".svg";
                    break;
                case "png":
                    exportedData = bpmnToPdfService.convertBpmnToPng(file);
                    mediaType = MediaType.IMAGE_PNG;
                    fileExtension = ".png";
                    break;
                case "xml":
                default:
                    exportedData = file.getData();
                    mediaType = MediaType.APPLICATION_XML;
                    fileExtension = ".xml";
                    break;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            headers.setContentDispositionFormData("attachment",
                    (file.getFileName() != null ? file.getFileName().replace(".bpmn", "") : "diagram") + fileExtension);
            headers.setContentLength(exportedData.length);

            return new ResponseEntity<>(exportedData, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // NEW: Validate BPMN file
    @PostMapping("/{id}/validate")
    public ResponseEntity<Map<String, Object>> validateBpmnFile(@PathVariable Long id) {
        try {
            File file = fileService.findFileById(id);
            if (file == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> validationResult = bpmnToPdfService.validateBpmnFile(file);
            return new ResponseEntity<>(validationResult, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // NEW: Get file preview/thumbnail
    @GetMapping("/{id}/preview")
    public ResponseEntity<byte[]> getFilePreview(@PathVariable Long id) {
        try {
            File file = fileService.findFileById(id);
            if (file == null) {
                return ResponseEntity.notFound().build();
            }

            byte[] previewData = bpmnToPdfService.generatePreview(file);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentLength(previewData.length);

            return new ResponseEntity<>(previewData, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename, HttpServletRequest request) {
        try {
            Path filePath = Paths.get(DIRECTORY).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new FileNotFoundException("File not found: " + filename);
            }

            String contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}