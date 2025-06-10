import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppFile } from '../files';


@Injectable({
  providedIn: 'root'
})
export class FileService {
private apiServerUrl = "http://localhost:8080/api/v1/file";
 constructor(private http: HttpClient) { }

  public uploadFile(file: File): Observable<AppFile> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    
    return this.http.post<AppFile>(`${this.apiServerUrl}/upload`, formData);
  }

  public getFiles(): Observable<AppFile[]> {
    return this.http.get<AppFile[]>(`${this.apiServerUrl}/all`);
  }

  public deleteFile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiServerUrl}/delete/${id}`);
  }

  public getFile(filename: string): Observable<AppFile> {
    return this.http.get<AppFile>(`${this.apiServerUrl}/file/${filename}`);
  }

  downloadFile(fileName: string): Observable<Blob> {
    const url = `http://localhost:8080/file/download/${encodeURIComponent(fileName)}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
