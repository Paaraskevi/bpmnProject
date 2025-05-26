import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import BPMN.js (after npm install bpmn-js)
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-bpmn-modeler',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './bpmn-modeler.component.html',
  styleUrl: './bpmn-modeler.component.css'
})
export class BpmnModelerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modelerContainer', { static: true }) modelerContainer!: ElementRef;

  propertiesForm = FormGroup;
  private modeler!: BpmnModeler;
  selectedElement: any = null;

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

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Initialize the modeler after view init
    setTimeout(() => {
      this.initializeModeler();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.modeler) {
      this.modeler.destroy();
    }
  }

  private initializeModeler(): void {
    try {
      this.modeler = new BpmnModeler({
        container: this.modelerContainer.nativeElement,
        keyboard: {
          bindTo: window
        }
      });

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
    });

    // Listen for element changes
    this.modeler.on('element.changed', (e: any) => {
      console.log('Element changed:', e.element);
    });
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

  createNewDiagram(): void {
    this.loadDiagram(this.defaultXml);
    this.selectedElement = null;
  }

  onFileChange(event: Event): void {
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
    if (!this.modeler) return;

    this.modeler.saveXML({ format: true })
      .then((result: any) => {
        const xml = result.xml;
        this.downloadXml(xml, 'diagram.bpmn');
      })
      .catch((error: any) => {
        console.error('Error saving diagram:', error);
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
}
