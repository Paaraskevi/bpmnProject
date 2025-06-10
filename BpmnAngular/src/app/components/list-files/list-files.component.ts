import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';
import { AppFile } from '../../files';
import feather from 'feather-icons';
import { AuthenticationService, User } from '../../services/authentication.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-list-files',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-files.component.html',
  styleUrl: './list-files.component.css'
})
export class ListFilesComponent implements OnInit, OnDestroy {
  @ViewChild('listfiles', { static: true }) listfiles!: ElementRef;
  
  appFile: AppFile[] = [];
  isLoading = true;
  currentUser: User | null = null;
  
  // Permission flags
  canView: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;
  canCreate: boolean = false;
  isViewerOnly: boolean = false;

  // Export states
  isExporting = false;
  exportingFileId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fileService: FileService,
    public authenticationService: AuthenticationService,
    private router: Router
  ) { }

  ngOnInit() {
    this.initializePermissions();
    this.authenticationService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        this.currentUser = user;
        this.initializePermissions();
      });

    // Initialize feather icons
    setTimeout(() => {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    }, 100);

    if (this.canView) {
      this.getFiles();
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializePermissions(): void {
    this.currentUser = this.authenticationService.getCurrentUser();
    
    // Set permissions based on user roles
    this.canView = this.authenticationService.canView();
    this.canEdit = this.authenticationService.canEdit();
    this.canCreate = this.authenticationService.canEdit();
    this.canDelete = this.authenticationService.isAdmin();

    // Check if user is viewer only
    this.isViewerOnly = this.authenticationService.isViewer() &&
      !this.authenticationService.isModeler() &&
      !this.authenticationService.isAdmin();

    console.log('File list permissions:', {
      canView: this.canView,
      canEdit: this.canEdit,
      canCreate: this.canCreate,
      canDelete: this.canDelete,
      isViewerOnly: this.isViewerOnly
    });
  }

  public getFiles(): void {
    if (!this.canView) {
      console.warn('User does not have permission to view files');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.fileService.getFiles().subscribe({
      next: (response: AppFile[]) => {
        this.appFile = response;
        this.isLoading = false;
        
        // Refresh feather icons after data loads
        setTimeout(() => {
          if (typeof feather !== 'undefined') {
            feather.replace();
          }
        }, 100);
      },
      error: (error: any) => {
        console.error('Error fetching files:', error);
        this.isLoading = false;
        this.showMessage('Error loading files: ' + error.message, 'error');
      }
    });
  }

  deleteFile(id: number): void {
    if (!this.canDelete) {
      this.showMessage('You do not have permission to delete files.', 'error');
      return;
    }

    if (confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      this.fileService.deleteFile(id).subscribe({
        next: () => {
          this.appFile = this.appFile.filter(file => file.id !== id);
          this.showMessage('File deleted successfully', 'success');
        },
        error: (error: any) => {
          console.error('Error deleting file:', error);
          this.showMessage('Error deleting file: ' + error.message, 'error');
        }
      });
    }
  }

  openFile(file: AppFile): void {
    if (!this.canView) {
      this.showMessage('You do not have permission to view files.', 'error');
      return;
    }

    // Navigate to BPMN modeler with file data
    const queryParams: any = {
      fileId: file.id,
      fileName: file.fileName,
      mode: this.isViewerOnly ? 'view' : 'edit'
    };

    this.router.navigate(['/modeler'], {
      queryParams: queryParams
    });
  }

  downloadFile(file: AppFile): void {
    if (!this.canView) {
      this.showMessage('You do not have permission to download files.', 'error');
      return;
    }

    this.fileService.downloadFile(file.id!).subscribe({
      next: (blob: Blob) => {
        this.downloadBlob(blob, file.fileName || 'diagram.bpmn');
        this.showMessage('File downloaded successfully', 'success');
      },
      error: (error: any) => {
        console.error('Error downloading file:', error);
        this.showMessage('Error downloading file: ' + error.message, 'error');
      }
    });
  }

  exportToPdf(file: AppFile): void {
    if (!this.canView) {
      this.showMessage('You do not have permission to export files.', 'error');
      return;
    }

    if (!file.id) {
      this.showMessage('Invalid file ID', 'error');
      return;
    }

    this.isExporting = true;
    this.exportingFileId = file.id;

    this.fileService.exportFileToPdf(file.id).subscribe({
      next: (pdfBlob: Blob) => {
        this.downloadBlob(pdfBlob, (file.fileName || 'diagram').replace(/\.(bpmn|xml)$/, '') + '.pdf');
        this.showMessage('File exported to PDF successfully', 'success');
      },
      error: (error: any) => {
        console.error('Error exporting file to PDF:', error);
        this.showMessage('Error exporting file to PDF: ' + error.message, 'error');
      },
      complete: () => {
        this.isExporting = false;
        this.exportingFileId = null;
      }
    });
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  navigateToModeler(): void {
    if (!this.canCreate) {
      this.showMessage('You do not have permission to create new files.', 'error');
      return;
    }
    this.router.navigateByUrl('/modeler');
  }

  navigateToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canEditFile(file: AppFile): boolean {
    // Admin can edit all files, modelers can edit their own or public files
    if (this.authenticationService.isAdmin()) {
      return true;
    }
    if (this.authenticationService.isModeler()) {
      return true; // For now, allow all modelers to edit files
    }
    return false;
  }

  canDeleteFile(file: AppFile): boolean {
    return this.authenticationService.isAdmin();
  }

  canDownloadFile(file: AppFile): boolean {
    return this.canView;
  }

  canExportFile(file: AppFile): boolean {
    return !(this.canView && !!file.content && (
      file.fileName?.endsWith('.bpmn') || 
      file.fileName?.endsWith('.xml') || 
      file.fileType?.includes('xml')
    ));
  }

  isExportingFile(file: AppFile): boolean {
    return this.isExporting && this.exportingFileId === file.id;
  }

  get currentUserRole(): string {
    if (this.authenticationService.isAdmin()) return 'Administrator';
    if (this.authenticationService.isModeler()) return 'Modeler';
    if (this.authenticationService.isViewer()) return 'Viewer';
    return 'Unknown';
  }

  get currentUserFullName(): string {
    if (this.currentUser && this.currentUser.firstname && this.currentUser.lastname) {
      return `${this.currentUser.firstname} ${this.currentUser.lastname}`;
    } else if (this.currentUser && this.currentUser.firstname) {
      return this.currentUser.firstname;
    } else if (this.currentUser && this.currentUser.username) {
      return this.currentUser.username;
    }
    return 'User';
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
      if (document.body.contains(messageDiv)) {
        document.body.removeChild(messageDiv);
      }
    }, 3000);
  }
}