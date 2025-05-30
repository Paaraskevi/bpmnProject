import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FileService } from '../services/file.service';
import { AppFile } from '../files';
import feather from 'feather-icons';

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
    private router: Router
  ) { }

  ngOnInit() {
    setTimeout(() => {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    }, 100);
    this.getFiles();
  }

  public getFiles(): void {
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
    // Navigate to modeler with file ID or implement your file opening logic
    this.router.navigate(['/app/modeler'], { 
      queryParams: { fileId: file.id } 
    });
  }

  downloadFile(file: AppFile): void {
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
    } else {
      alert('File content is not available for download.');
    }
  }

  navigateToModeler(): void {
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
}