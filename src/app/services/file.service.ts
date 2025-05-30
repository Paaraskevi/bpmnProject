import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppFile } from '../files';


@Injectable({
  providedIn: 'root'
})
export class FileService {
private apiServerUrl = "http://localhost:8080/";
 constructor(private http: HttpClient) { }

    public getFiles(): Observable<AppFile[]> {
    return this.http.get<AppFile[]>(`${this.apiServerUrl}/file/all`);
  }

  public deleteFile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiServerUrl}/file/delete/${id}`);
  }

  public getFile(filename: string): Observable<AppFile> {
    return this.http.get<AppFile>(`${this.apiServerUrl}/file/${filename}`);
  }
}
