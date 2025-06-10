import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppFile } from '../files';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiServerUrl = "http://localhost:8080/api/v1/file";
  
  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  /**
   * Upload a file to the server
   */
  public uploadFile(file: File): Observable<AppFile> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    
    // For multipart upload, don't set Content-Type header - let browser set it
    const headers = this.getUploadHeaders();
    
    console.log('Uploading file with headers:', headers.keys());
    
    return this.http.post<AppFile>(`${this.apiServerUrl}/upload`, formData, {
      headers: headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Upload BPMN content as new file
   */
  public uploadBpmnContent(fileName: string, content: string): Observable<AppFile> {
    const blob = new Blob([content], { type: 'application/xml' });
    const file = new File([blob], fileName, { type: 'application/xml' });
    return this.uploadFile(file);
  }

  /**
   * Get all files from server
   */
  public getFiles(): Observable<AppFile[]> {
    return this.http.get<AppFile[]>(`${this.apiServerUrl}/all`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete file by ID
   */
  public deleteFile(id: number): Observable<any> {
    return this.http.delete(`${this.apiServerUrl}/delete/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get file by filename
   */
  public getFile(filename: string): Observable<AppFile> {
    return this.http.get<AppFile>(`${this.apiServerUrl}/file/${filename}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get file by ID
   */
  public getFileById(id: number): Observable<AppFile> {
    return this.http.get<AppFile>(`${this.apiServerUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get file content as string
   */
  public getFileContent(id: number): Observable<string> {
    return this.http.get(`${this.apiServerUrl}/${id}/content`, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Export file as PDF
   */
  public exportFileToPdf(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiServerUrl}/${fileId}/export/pdf`, {
      responseType: 'blob',
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Export file as PDF with metadata
   */
  public exportFileToPdfWithMetadata(fileId: number, metadata?: any): Observable<Blob> {
    return this.http.post(`${this.apiServerUrl}/${fileId}/export/pdf`, metadata || {}, {
      responseType: 'blob',
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Export file in various formats
   */
  public exportFile(fileId: number, format: 'xml' | 'svg' | 'png' | 'pdf'): Observable<Blob> {
    return this.http.get(`${this.apiServerUrl}/${fileId}/export/${format}`, {
      responseType: 'blob',
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Download file as blob
   */
  public downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiServerUrl}/${fileId}/download`, {
      responseType: 'blob',
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Validate BPMN file
   */
  public validateBpmnFile(fileId: number): Observable<{valid: boolean; errors?: string[]; warnings?: string[]}> {
    return this.http.post<{valid: boolean; errors?: string[]; warnings?: string[]}>(`${this.apiServerUrl}/${fileId}/validate`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get file preview/thumbnail
   */
  public getFilePreview(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiServerUrl}/${fileId}/preview`, {
      responseType: 'blob',
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update existing file content
   */
  public updateFileContent(fileId: number, content: string): Observable<AppFile> {
    const blob = new Blob([content], { type: 'application/xml' });
    const file = new File([blob], 'updated_file.bpmn', { type: 'application/xml' });
    
    const formData = new FormData();
    formData.append("file", file);
    
    return this.http.put<AppFile>(`${this.apiServerUrl}/${fileId}`, formData, {
      headers: this.getUploadHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get authentication headers for JSON requests
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Don't set Content-Type for requests that might need different content types
    return headers;
  }

  /**
   * Get headers for file upload (multipart form data)
   */
  private getUploadHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Don't set Content-Type for multipart form data - let the browser set it
    return headers;
  }

  /**
   * Error handling with detailed logging
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred while processing the file';
    
    console.error('Full error object:', error);
    console.error('Error status:', error.status);
    console.error('Error message:', error.message);
    console.error('Error body:', error.error);
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized - please log in again';
          console.error('Authentication failed - redirecting to login');
          this.authService.logout();
          break;
        case 403:
          errorMessage = 'Forbidden - insufficient permissions';
          console.error('Permission denied. Check user roles and endpoint security configuration.');
          console.error('Current user token:', this.authService.getToken() ? 'Present' : 'Missing');
          console.error('User roles:', this.authService.getUserRoles());
          break;
        case 404:
          errorMessage = 'File not found';
          break;
        case 413:
          errorMessage = 'File too large';
          break;
        case 415:
          errorMessage = 'Unsupported file type';
          break;
        case 422:
          errorMessage = 'Invalid file format';
          break;
        case 500:
          errorMessage = 'Server error - please try again later';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else {
            errorMessage = `Error: ${error.status} - ${error.statusText}`;
          }
      }
    }
    
    console.error('File Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}