import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FileService } from '../../services/file.service';
import { AppFile } from '../../files';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import { AuthenticationService, User } from '../../services/authentication.service';

@Component({
  selector: 'app-bpmn-modeler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bpmn-modeler.component.html',
  styleUrl: './bpmn-modeler.component.css'
})
export class BpmnModelerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modelerContainer', { static: true }) modelerContainer!: ElementRef;

  private modeler!: BpmnModeler | BpmnViewer;
  private destroy$ = new Subject<void>();
  
  selectedElement: any = null;
  isEditMode: boolean = false;
  currentFile: AppFile | null = null;
  isViewerOnly: boolean = false;
  hasUnsavedChanges: boolean = false;
  
  // Permission flags
  canEdit: boolean = false;
  canView: boolean = false;
  canCreate: boolean = false;
  canDelete: boolean = false;
  
  // Current user info
  currentUser: User | null = null;
  userRoles: string[] = [];
  
  // Editable properties
  editableProperties: any = {
    name: '',
    id: '',
    documentation: '',
    assignee: '',
    candidateUsers: '',
    candidateGroups: '',
    formKey: '',
    priority: '',
    dueDate: '',
    followUpDate: '',
    candidateStarter: '',
    executionTime: ''
  };

  private defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="79" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  constructor(
    private authService: AuthenticationService,
    private fileService: FileService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializePermissions();
    
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        this.currentUser = user;
        this.initializePermissions();
      });

    // Check for file ID in query params
    this.route.queryParams.subscribe(params => {
      if (params['fileId']) {
        this.loadFileById(parseInt(params['fileId']));
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeModeler();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.modeler) {
      this.modeler.destroy();
    }
  }

  private initializePermissions(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.userRoles = this.authService.getUserRoles();

    this.canView = this.authService.canView();
    this.canEdit = this.authService.canEdit();
    this.canCreate = this.authService.canEdit();
    this.canDelete = this.authService.isAdmin();
    
    this.isViewerOnly = this.authService.isViewer() && 
                       !this.authService.isModeler() && 
                       !this.authService.isAdmin();

    console.log('BPMN Modeler permissions:', {
      canView: this.canView,
      canEdit: this.canEdit,
      canCreate: this.canCreate,
      canDelete: this.canDelete,
      isViewerOnly: this.isViewerOnly,
      roles: this.userRoles
    });
  }

  private initializeModeler(): void {
    try {
      if (this.isViewerOnly) {
        this.modeler = new BpmnViewer({
          container: this.modelerContainer.nativeElement
        });
        console.log('Initialized BPMN Viewer (read-only mode)');
      } else {
        this.modeler = new BpmnModeler({
          container: this.modelerContainer.nativeElement,
          keyboard: {
            bindTo: window
          }
        });
        console.log('Initialized BPMN Modeler (edit mode)');
      }

      // Load diagram
      if (this.currentFile) {
        this.loadDiagram(this.currentFile.content || this.defaultXml);
      } else {
        this.loadDiagram(this.defaultXml);
      }

      this.addEventListeners();

    } catch (error) {
      console.error('Error initializing BPMN modeler:', error);
    }
  }

  private addEventListeners(): void {
    if (!this.modeler) return;

    // Listen for element selection
    this.modeler.on('selection.changed', (e: any) => {
      const element = e.newSelection[0];
      this.selectedElement = element || null;
      this.isEditMode = false;
      
      if (this.selectedElement) {
        this.loadElementProperties();
      }
    });

    // Listen for element changes (only in edit mode)
    if (!this.isViewerOnly) {
      this.modeler.on('element.changed', (e: any) => {
        this.hasUnsavedChanges = true;
        console.log('Element changed:', e.element);
      });

      this.modeler.on('commandStack.changed', (e: any) => {
        this.hasUnsavedChanges = true;
      });
    }
  }

  private loadElementProperties(): void {
    if (!this.selectedElement || !this.selectedElement.businessObject) {
      return;
    }

    const bo = this.selectedElement.businessObject;
    
    this.editableProperties = {
      name: bo.name || '',
      id: bo.id || '',
      documentation: bo.documentation?.[0]?.text || '',
      assignee: bo.assignee || '',
      candidateUsers: bo.candidateUsers?.join(', ') || '',
      candidateGroups: bo.candidateGroups?.join(', ') || '',
      formKey: bo.formKey || '',
      priority: bo.priority || '',
      dueDate: bo.dueDate || '',
      followUpDate: bo.followUpDate || '',
      candidateStarter: bo.candidateStarter || '',
      executionTime: bo.executionTime || ''
    };
  }

  private loadDiagram(xml: string): void {
    if (!this.modeler) return;

    this.modeler.importXML(xml)
      .then(() => {
        console.log('Diagram loaded successfully');
        this.zoomToFit();
        this.hasUnsavedChanges = false;
      })
      .catch((error: any) => {
        console.error('Error loading diagram:', error);
        this.showMessage('Error loading diagram: ' + error.message, 'error');
      });
  }

  private loadFileById(fileId: number): void {
    if (!this.canView) {
      this.showMessage('You do not have permission to view files.', 'error');
      return;
    }

    this.fileService.getFileById(fileId).subscribe({
      next: (file: AppFile) => {
        this.currentFile = file;
        console.log('Loaded file:', file.fileName);
        
        if (this.modeler) {
          this.loadDiagram(file.content || this.defaultXml);
        }
      },
      error: (error: any) => {
        console.error('Error loading file:', error);
        this.showMessage('Error loading file: ' + error.message, 'error');
      }
    });
  }

  // Public methods for template
  createNewDiagram(): void {
    if (!this.canCreate) {
      this.showMessage('You do not have permission to create new diagrams.', 'error');
      return;
    }

    if (this.hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to create a new diagram?')) {
        return;
      }
    }
    
    this.currentFile = null;
    this.loadDiagram(this.defaultXml);
    this.selectedElement = null;
    this.isEditMode = false;
    this.hasUnsavedChanges = false;
  }

  onFileChange(event: Event): void {
    if (!this.canView) {
      this.showMessage('You do not have permission to open diagrams.', 'error');
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      if (this.hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Are you sure you want to open a new file?')) {
          return;
        }
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const xml = e.target?.result as string;
        this.loadDiagram(xml);
        this.currentFile = null; // Mark as new file from local
        this.hasUnsavedChanges = true;
      };
      reader.readAsText(file);
    }
  }

  saveDiagram(): void {
    if (!this.canEdit) {
      this.showMessage('You do not have permission to save diagrams.', 'error');
      return;
    }

    if (!this.modeler) return;

    // Type guard to check if modeler has saveXML method
    if ('saveXML' in this.modeler) {
      this.modeler.saveXML({ format: true })
        .then((result: any) => {
          const xml = result.xml;
          
          if (this.currentFile) {
            // Update existing file
            this.updateExistingFile(xml);
          } else {
            // Save as new file
            this.saveAsNewFile(xml);
          }
        })
        .catch((error: any) => {
          console.error('Error saving diagram:', error);
          this.showMessage('Error saving diagram: ' + error.message, 'error');
        });
    } else {
      this.showMessage('Cannot save in viewer mode.', 'error');
    }
  }

  private saveAsNewFile(xml: string): void {
    const fileName = prompt('Enter filename:', 'new_diagram.bpmn');
    if (!fileName) return;

    this.fileService.uploadBpmnContent(fileName, xml).subscribe({
      next: (savedFile: AppFile) => {
        this.currentFile = savedFile;
        this.hasUnsavedChanges = false;
        this.showMessage('Diagram saved successfully as ' + fileName, 'success');
      },
      error: (error: any) => {
        console.error('Error saving file:', error);
        this.showMessage('Error saving file: ' + error.message, 'error');
      }
    });
  }

  private updateExistingFile(xml: string): void {
    if (!this.currentFile?.id) return;

    this.fileService.updateFileContent(this.currentFile.id, xml).subscribe({
      next: (updatedFile: AppFile) => {
        this.currentFile = updatedFile;
        this.hasUnsavedChanges = false;
        this.showMessage('Diagram updated successfully', 'success');
      },
      error: (error: any) => {
        console.error('Error updating file:', error);
        this.showMessage('Error updating file: ' + error.message, 'error');
      }
    });
  }

  exportToPdf(): void {
    if (!this.currentFile?.id) {
      this.showMessage('Please save the diagram first before exporting to PDF.', 'warning');
      return;
    }

    this.fileService.exportFileToPdf(this.currentFile.id).subscribe({
      next: (pdfBlob: Blob) => {
        this.downloadBlob(pdfBlob, (this.currentFile?.fileName || 'diagram').replace(/\.(bpmn|xml)$/, '') + '.pdf');
        this.showMessage('Diagram exported to PDF successfully', 'success');
      },
      error: (error: any) => {
        console.error('Error exporting to PDF:', error);
        this.showMessage('Error exporting to PDF: ' + error.message, 'error');
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

  // Property editing methods
  toggleEditMode(): void {
    if (!this.canEdit) {
      this.showMessage('You do not have permission to edit element properties.', 'error');
      return;
    }

    if (this.isEditMode) {
      this.saveProperties();
    }
    this.isEditMode = !this.isEditMode;
  }

  saveProperties(): void {
    if (!this.canEdit || !this.selectedElement || !this.selectedElement.businessObject) {
      return;
    }

    if (!('get' in this.modeler)) {
      this.showMessage('Cannot edit properties in viewer mode.', 'error');
      return;
    }

    const modeling = this.modeler.get('modeling');
    const bo = this.selectedElement.businessObject;

    // Update basic properties
    if (this.editableProperties.name !== bo.name) {
      modeling.updateProperties(this.selectedElement, {
        name: this.editableProperties.name || undefined
      });
    }

    // Update documentation
    if (this.editableProperties.documentation !== (bo.documentation?.[0]?.text || '')) {
      const documentation = this.editableProperties.documentation ? 
        [{ text: this.editableProperties.documentation }] : undefined;
      
      modeling.updateProperties(this.selectedElement, {
        documentation: documentation
      });
    }

    // Update other properties
    const processProperties: any = {};

    if (this.editableProperties.assignee !== (bo.assignee || '')) {
      processProperties.assignee = this.editableProperties.assignee || undefined;
    }

    if (this.editableProperties.candidateUsers !== (bo.candidateUsers?.join(', ') || '')) {
      processProperties.candidateUsers = this.editableProperties.candidateUsers ? 
        this.editableProperties.candidateUsers.split(',').map((u: string) => u.trim()).filter((u: string) => u) : 
        undefined;
    }

    if (this.editableProperties.candidateGroups !== (bo.candidateGroups?.join(', ') || '')) {
      processProperties.candidateGroups = this.editableProperties.candidateGroups ? 
        this.editableProperties.candidateGroups.split(',').map((g: string) => g.trim()).filter((g: string) => g) : 
        undefined;
    }

    if (this.editableProperties.formKey !== (bo.formKey || '')) {
      processProperties.formKey = this.editableProperties.formKey || undefined;
    }

    if (this.editableProperties.priority !== (bo.priority || '')) {
      processProperties.priority = this.editableProperties.priority || undefined;
    }

    if (this.editableProperties.dueDate !== (bo.dueDate || '')) {
      processProperties.dueDate = this.editableProperties.dueDate || undefined;
    }

    if (this.editableProperties.followUpDate !== (bo.followUpDate || '')) {
      processProperties.followUpDate = this.editableProperties.followUpDate || undefined;
    }

    if (this.editableProperties.candidateStarter !== (bo.candidateStarter || '')) {
      processProperties.candidateStarter = this.editableProperties.candidateStarter || undefined;
    }

    if (this.editableProperties.executionTime !== (bo.executionTime || '')) {
      processProperties.executionTime = this.editableProperties.executionTime || undefined;
    }

    // Apply properties if any changes exist
    if (Object.keys(processProperties).length > 0) {
      modeling.updateProperties(this.selectedElement, processProperties);
    }

    this.hasUnsavedChanges = true;
    console.log('Properties saved successfully');
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.loadElementProperties();
  }

  zoomIn(): void {
    if (this.modeler) {
      const canvas = this.modeler.get('canvas');
      const zoom = canvas.zoom();
      canvas.zoom(zoom + 0.1);
    }
  }

  zoomOut(): void {
    if (this.modeler) {
      const canvas = this.modeler.get('canvas');
      const zoom = canvas.zoom();
      canvas.zoom(Math.max(zoom - 0.1, 0.1));
    }
  }

  zoomToFit(): void {
    if (this.modeler) {
      const canvas = this.modeler.get('canvas');
      canvas.zoom('fit-viewport');
    }
  }

  // Helper methods for template
  get currentUserRole(): string {
    if (this.authService.isAdmin()) return 'Administrator';
    if (this.authService.isModeler()) return 'Modeler';
    if (this.authService.isViewer()) return 'Viewer';
    return 'Unknown';
  }

  get canEditProperties(): boolean {
    return this.canEdit && this.selectedElement && !this.isViewerOnly;
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

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isModeler(): boolean {
    return this.authService.isModeler();
  }

  get isViewer(): boolean {
    return this.authService.isViewer();
  }

  get currentFileName(): string {
    return this.currentFile?.fileName || 'New Diagram';
  }

  get hasFileLoaded(): boolean {
    return this.currentFile !== null;
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