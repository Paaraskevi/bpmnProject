// dashboard.component.ts
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,RouterModule],
  template: `
    <div class="dashboard-container">
      <div class="welcome-section">
        <h1>Welcome to AKON-KORIMVOS</h1>
        <p>Your BPMN modeling platform</p>
      </div>
      
      <div class="dashboard-cards">
        <div class="card" (click)="navigateToModeler()">
          <div class="card-icon">
            <i class="bx bx-edit"></i>
          </div>
          <h3>BPMN Modeler</h3>
           <p><a routerLink="/modeler">Create and edit BPMN diagrams</a></p>
        </div>
        
         <div class="card" (click)="navigateToFileList()">
          <div class="card-icon">
            <i class="bx bx-folder-open"></i>
          </div>
          <h3>Recent Files</h3>
             <p><a routerLink="/list">Access your recent projects</a></p>
        </div>
        
        <div class="card">
          <div class="card-icon">
            <i class="bx bx-cog"></i>
          </div>
          <h3>Settings</h3>
          <p>Configure your preferences</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .welcome-section {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .welcome-section h1 {
      font-size: 3rem;
      font-weight: 800;
      background: linear-gradient(135deg, #969aab 0%, #151316 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }
    
    .welcome-section p {
      font-size: 1.2rem;
      color: #4a5568;
    }
    
    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    
    .card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    }
    
    .card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }
    
    .card-icon {
      font-size: 3rem;
      color: #667eea;
      margin-bottom: 1rem;
    }
    
    .card h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }
    
    .card p {
      color: #4a5568;
      font-size: 1rem;
    }
  `]
})
export class DashboardComponent {
  constructor(private router: Router) {}
  
  navigateToModeler(): void {
    this.router.navigateByUrl('/modeler');
  }
  navigateToFileList(): void {
    this.router.navigateByUrl('/app/list');
  }
}