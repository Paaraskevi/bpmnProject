import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthenticationService } from './authentication.service';

export interface BpmnDiagram {
  id: number;
  name: string;
  description?: string;
  xml: string;
  svg?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isPublic: boolean;
  tags?: string[];
}

export interface DiagramCreateRequest {
  name: string;
  description?: string;
  xml: string;
  svg?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface DiagramUpdateRequest extends DiagramCreateRequest {
  id: number;
  version: number;
}

@Injectable({
  providedIn: 'root'
})
export class BpmnService {
  private apiUrl = '/api/diagrams';
  private currentDiagramSubject = new BehaviorSubject<BpmnDiagram | null>(null);
  
  public currentDiagram$ = this.currentDiagramSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  // Get all diagrams (based on user permissions)
  getAllDiagrams(): Observable<BpmnDiagram[]> {
    return this.http.get<BpmnDiagram[]>(`${this.apiUrl}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get diagram by ID
  getDiagram(id: number): Observable<BpmnDiagram> {
    return this.http.get<BpmnDiagram>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Create new diagram (MODELER, ADMIN only)
  createDiagram(diagram: DiagramCreateRequest): Observable<BpmnDiagram> {
    if (!this.authService.canEdit()) {
      throw new Error('Insufficient permissions to create diagrams');
    }

    return this.http.post<BpmnDiagram>(`${this.apiUrl}`, diagram, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Update existing diagram (MODELER, ADMIN only)
  updateDiagram(diagram: DiagramUpdateRequest): Observable<BpmnDiagram> {
    if (!this.authService.canEdit()) {
      throw new Error('Insufficient permissions to update diagrams');
    }

    return this.http.put<BpmnDiagram>(`${this.apiUrl}/${diagram.id}`, diagram, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Delete diagram (ADMIN only)
  deleteDiagram(id: number): Observable<void> {
    if (!this.authService.isAdmin()) {
      throw new Error('Insufficient permissions to delete diagrams');
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get user's diagrams
  getUserDiagrams(): Observable<BpmnDiagram[]> {
    return this.http.get<BpmnDiagram[]>(`${this.apiUrl}/my-diagrams`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get public diagrams
  getPublicDiagrams(): Observable<BpmnDiagram[]> {
    return this.http.get<BpmnDiagram[]>(`${this.apiUrl}/public`);
  }

  // Search diagrams
  searchDiagrams(query: string): Observable<BpmnDiagram[]> {
    return this.http.get<BpmnDiagram[]>(`${this.apiUrl}/search`, {
      params: { q: query },
      headers: this.authService.getAuthHeaders()
    });
  }

  // Export diagram
  exportDiagram(id: number, format: 'xml' | 'svg' | 'png'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export/${format}`, {
      responseType: 'blob',
      headers: this.authService.getAuthHeaders()
    });
  }

  // Import diagram
  importDiagram(file: File): Observable<BpmnDiagram> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<BpmnDiagram>(`${this.apiUrl}/import`, formData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Set current diagram
  setCurrentDiagram(diagram: BpmnDiagram | null): void {
    this.currentDiagramSubject.next(diagram);
  }

  // Get current diagram
  get currentDiagram(): BpmnDiagram | null {
    return this.currentDiagramSubject.value;
  }

  // Validate diagram XML
  validateDiagram(xml: string): Observable<{ valid: boolean; errors?: string[] }> {
    return this.http.post<{ valid: boolean; errors?: string[] }>(`${this.apiUrl}/validate`, { xml }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Share diagram
  shareDiagram(id: number, userIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/share`, { userIds }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get diagram history/versions
  getDiagramHistory(id: number): Observable<BpmnDiagram[]> {
    return this.http.get<BpmnDiagram[]>(`${this.apiUrl}/${id}/history`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Permission check helpers
  canEditDiagram(diagram: BpmnDiagram): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    
    // Admin can edit all diagrams
    if (this.authService.isAdmin()) return true;
    
    // Modelers can edit their own diagrams
    if (this.authService.isModeler() && diagram.createdBy === user.username) return true;
    
    return false;
  }

  canViewDiagram(diagram: BpmnDiagram): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    
    // Everyone with view permission can see public diagrams
    if (diagram.isPublic && this.authService.canView()) return true;
    
    // Admin can view all diagrams
    if (this.authService.isAdmin()) return true;
    
    // Users can view their own diagrams
    if (diagram.createdBy === user.username) return true;
    
    return false;
  }

  canDeleteDiagram(diagram: BpmnDiagram): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    
    // Only admin can delete diagrams
    if (this.authService.isAdmin()) return true;
    
    // Modelers can delete their own diagrams
    if (this.authService.isModeler() && diagram.createdBy === user.username) return true;
    
    return false;
  }
}