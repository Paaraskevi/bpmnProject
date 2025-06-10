// file.service.ts - Enhanced with PDF Export
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

  public uploadFile(file: File): Observable<AppFile> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    
    return this.http.post<AppFile>(`${this.apiServerUrl}/upload`, formData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  public getFiles(): Observable<AppFile[]> {
    return this.http.get<AppFile[]>(`${this.apiServerUrl}/all`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  public deleteFile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiServerUrl}/delete/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  public getFile(filename: string): Observable<AppFile> {
    return this.http.get<AppFile>(`${this.apiServerUrl}/file/${filename}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  public getFileById(id: number): Observable<AppFile> {
    return this.http.get<AppFile>(`${this.apiServerUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // NEW: Export file as PDF
  public exportFileToPdf(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiServerUrl}/${fileId}/export/pdf`, {
      responseType: 'blob',
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // NEW: Export file as PDF with metadata
  public exportFileToPdfWithMetadata(fileId: number, metadata?: any): Observable<Blob> {
    const headers = new HttpHeaders({
      ...this.authService.getAuthHeaders(),
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiServerUrl}/${fileId}/export/pdf`, metadata || {}, {
      responseType: 'blob',
      headers: headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  // NEW: Export file in various formats
  public exportFile(fileId: number, format: 'xml' | 'svg' | 'png' | 'pdf'): Observable<Blob> {
    return this.http.get(`${this.apiServerUrl}/${fileId}/export/${format}`, {
      responseType: 'blob',
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Enhanced download with proper headers
  public downloadFile(fileName: string): Observable<Blob> {
    const url = `${this.apiServerUrl}/download/${encodeURIComponent(fileName)}`;
    return this.http.get(url, { 
      responseType: 'blob',
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // NEW: Validate BPMN file
  public validateBpmnFile(fileId: number): Observable<{valid: boolean; errors?: string[]; warnings?: string[]}> {
    return this.http.post<{valid: boolean; errors?: string[]; warnings?: string[]}>(`${this.apiServerUrl}/${fileId}/validate`, {}, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // NEW: Get file preview/thumbnail
  public getFilePreview(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiServerUrl}/${fileId}/preview`, {
      responseType: 'blob',
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Legacy method for PDF download (keeping for backward compatibility)
  downloadPdf(): Observable<HttpResponse<Blob>> {
    return this.http.post('url-to-pdf-api', {}, { 
      responseType: 'blob', 
      observe: 'response',
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Error handling
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'An error occurred while processing the file';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized - please log in again';
          this.authService.logout();
          break;
        case 403:
          errorMessage = 'Forbidden - insufficient permissions';
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
          errorMessage = error.error?.message || `Error: ${error.status}`;
      }
    }
    
    console.error('File Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}