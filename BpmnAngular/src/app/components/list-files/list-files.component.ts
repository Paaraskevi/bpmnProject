import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';
import { AppFile } from '../../files';
import feather from 'feather-icons';
import { AuthenticationService, User } from '../../services/authentication.service';
import { Subject, take, takeUntil } from 'rxjs';
import { BpmnService } from '../../services/bpmn.service';

@Component({
  selector: 'app-list-files',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-files.component.html',
  styleUrl: './list-files.component.css'
})
export class ListFilesComponent implements OnInit {
  @ViewChild('listfiles', { static: true }) listfiles!: ElementRef;
  appFile: AppFile[] = [];
  selectedFile: File | null = null;
  isLoading = true;

  constructor(
    private fileService: FileService,
    private bpmnService: BpmnService,
    public authenticationService: AuthenticationService,
    private router: Router
  ) { }
  currentUser: User | null = null;
  canView: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;
  canCreate: boolean = false;
  isViewerOnly: boolean = false;

  isExporting = false;
  exportingFileId: number | null = null;

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.initialisePermissions();
    this.authenticationService.currentUser$.pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        this.currentUser = user;
        this.initialisePermissions();
      });

    setTimeout(() => {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    }, 100);
    if (this.canView) {
      this.getFiles()
    } else {
      this.isLoading = false;
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private initialisePermissions(): void {
    this.currentUser = this.authenticationService.getCurrentUser();
    //set permissions based on user roles
    this.canView = this.authenticationService.canView();
    this.canEdit = this.authenticationService.canEdit();
    this.canCreate = this.authenticationService.canEdit(); // Same as edit for now
    this.canDelete = this.authenticationService.isAdmin(); // Only admins can delete

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
    this.fileService.getFiles().subscribe(
      (response: AppFile[]) => {
        this.appFile = response;
        this.isLoading = false;
        // Refresh feather icons after data loads
        setTimeout(() => {
          if (typeof feather !== 'undefined') {
            feather.replace();
          }
        }, 100);
      },
      (error: any) => {
        console.error('Error fetching files:', error);
        this.isLoading = false;
      }
    );
  }

  deleteFile(id: number): void {

    if (!this.canDelete) {
      alert('You do not have permission to delete files.');
      return;
    }

    if (confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      this.fileService.deleteFile(id).subscribe(
        () => {
          this.appFile = this.appFile.filter(file => file.id !== id);
          // Show success message (you can implement a toast service)
          console.log('File deleted successfully');
        },
        (error: any) => {
          console.error('Error deleting file:', error);
          alert('Error deleting file. Please try again.');
        }
      );
    }
  }

  openFile(file: AppFile): void {
    if (!this.canView) {
      alert('You do not have permission to view files.');
      return;
    }
    const queryParams: any = {
      fileId: file.id,
      mode: this.isViewerOnly ? 'view' : 'edit'
    };

    this.router.navigate(['/app/modeler'], {
      queryParams: queryParams
    });
  }

  downloadFile(file: AppFile): void {
    if (!this.canView) {
      alert('You do not have permission to download files.');
      return;
    }
    if (file.content) {
      const blob = new Blob([file.content], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.fileName || 'diagram'}.bpmn`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.showMessage('File downloaded successfully', 'success');
    } else {
      alert('File content is not available for download.');
    }
  }
  exportToPdf(file: AppFile): void {
    if (!this.canView) {
      alert('You do not have permission to export files.');
      return;
    }
    if (!file.content) {
      alert('File content is not available for export.');
      return;
    }
    this.isExporting = true;
    this.exportingFileId = file.id;

    this.bpmnService.exportDiagram(file.id, 'pdf').subscribe({
      next: (pdfBlob: Blob) => {
        this.downloadPdfBlob(pdfBlob, file.fileName || 'diagram');
        this.showMessage('File exported to PDF successfully', 'success');
      }, error: (error: any) => {
        console.error('Error exporting file to PDF:', error);
        alert('Error exporting file to PDF. Please try again.');
      },
      complete: () => {
        this.isExporting = false;
        this.exportingFileId = null;
      }
    });
  }

  private exportpdfFallback(file: AppFile): void {
    this.fileService.exportFileToPdf(file.id).subscribe({
      next: (pdfBLob: Blob) => {
        this.downloadPdfBlob(pdfBLob, file.fileName || 'diagram');
        this.showMessage('PDF exported successfully', 'success');
      },
      error: (error: any) => {
        console.error('Error exporting file to PDF:', error);
        this.showMessage('Error exporting file to PDF. Please try again.', 'error');
      },
      complete: () => {
        this.isExporting = false;
        this.exportingFileId = null;
      }
    });
  }
  private downloadPdfBlob(pdfBlob: Blob, fileName: string): void {
      const url = window.URL.createObjectURL(pdfBlob); 
      const d = document.createElement('d');
      d.href = url;
      d.download = `${fileName}.pdf`;
      document.click(d);
      document.body.removeChild(d);
      window
  }

  navigateToModeler(): void {
    if (!this.canCreate) {
      alert('You do not have permission to create new files.');
      return;
    }
    this.router.navigateByUrl('/app/modeler');
  }

  navigateToDashboard(): void {
    this.router.navigateByUrl('/app/dashboard');
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
    if (!this.authenticationService.isAdmin()) return true;
    if (this.authenticationService.isModeler()) { return false; }
    return false;
  }

  canDeleteFile(file: AppFile): boolean {
    return this.authenticationService.isAdmin();
  }

  canDownloadFile(file: AppFile): boolean {
    return this.canView;
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
    // Simple message display - you can replace this with a proper toast service
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
      document.body.removeChild(messageDiv);
    }, 3000);
  }
}