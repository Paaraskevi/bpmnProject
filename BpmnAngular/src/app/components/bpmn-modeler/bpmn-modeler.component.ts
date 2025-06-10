// bpmn-modeler.component.ts
import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DownloadService } from '../../services/download.service';
// Import BPMN.js (after npm install bpmn-js)
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import { AuthenticationService, User } from '../../services/authentication.service';
import { BpmnService } from '../../services/bpmn.service';

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
  
  // Permission flags
  canEdit: boolean = false;
  canView: boolean = false;
  canCreate: boolean = false;
  canDelete: boolean = false;
  isViewerOnly: boolean = false;
  
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
    private bpmnService: BpmnService,
    private downloadService: DownloadService
  ) {}

  ngOnInit(): void {
    // Initialize permissions based on user roles
    this.initializePermissions();
    
    // Subscribe to current user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        this.currentUser = user;
        this.initializePermissions();
      });
  }

  ngAfterViewInit(): void {
    // Initialize the modeler after view init
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
    // Get current user and roles
    this.currentUser = this.authService.getCurrentUser();
    this.userRoles = this.authService.getUserRoles();

    // Set permission flags based on roles
    this.canView = this.authService.canView();
    this.canEdit = this.authService.canEdit();
    this.canCreate = this.authService.canEdit(); // Same as edit for now
    this.canDelete = this.authService.isAdmin(); // Only admins can delete
    
    // Check if user is viewer only
    this.isViewerOnly = this.authService.isViewer() && 
                       !this.authService.isModeler() && 
                       !this.authService.isAdmin();

    console.log('User permissions:', {
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
      // Use viewer for read-only users, modeler for editors
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

      // Load default diagram
      this.loadDiagram(this.defaultXml);

      // Add event listeners
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
        console.log('Element changed:', e.element);
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
      })
      .catch((error: any) => {
        console.error('Error loading diagram:', error);
      });
  }

  // Permission-checked actions
  createNewDiagram(): void {
    if (!this.canCreate) {
      alert('You do not have permission to create new diagrams.');
      return;
    }
    
    this.loadDiagram(this.defaultXml);
    this.selectedElement = null;
    this.isEditMode = false;
  }

  onFileChange(event: Event): void {
    if (!this.canView) {
      alert('You do not have permission to open diagrams.');
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const xml = e.target?.result as string;
        this.loadDiagram(xml);
      };
      reader.readAsText(file);
    }
  }

  saveDiagram(): void {
    if (!this.canEdit) {
      alert('You do not have permission to save diagrams.');
      return;
    }

    if (!this.modeler) return;

    // Type guard to check if modeler has saveXML method
    // if ('saveXML' in this.modeler) {
    //   this.modeler.saveXML({ format: true })
    //     .then((result: any) => {
    //       const xml = result.xml;
    //       this.downloadXml(xml, 'diagram.bpmn');
    //     })
    //     .catch((error: any) => {
    //       console.error('Error saving diagram:', error);
    //     });
    // } else {
    //   alert('Cannot save in viewer mode.');
    // }

    this.downloadService.downloadPdf().subscribe(response => {
      const blob = new Blob([response.body], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'export.pdf';
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  private downloadXml(xml: string, filename: string): void {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Property editing methods (only for editors)
  toggleEditMode(): void {
    if (!this.canEdit) {
      alert('You do not have permission to edit element properties.');
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

    // Type guard to check if modeler has get method (Modeler vs Viewer)
    if (!('get' in this.modeler)) {
      alert('Cannot edit properties in viewer mode.');
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

    // Update process-specific properties
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

    // Apply process properties if any changes exist
    if (Object.keys(processProperties).length > 0) {
      modeling.updateProperties(this.selectedElement, processProperties);
    }

    console.log('Properties saved successfully');
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.loadElementProperties(); // Reload original properties
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

  // Make authentication service methods available to template
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isModeler(): boolean {
    return this.authService.isModeler();
  }

  get isViewer(): boolean {
    return this.authService.isViewer();
  }
}