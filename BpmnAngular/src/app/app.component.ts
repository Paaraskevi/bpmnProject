import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { BpmnModelerComponent } from './components/bpmn-modeler/bpmn-modeler.component';
import { LocalStorageService } from './services/local-storage.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  @ViewChild(BpmnModelerComponent) bpmnModeler!: BpmnModelerComponent;
  isLoggedIn = false;
  
  constructor(
    private router: Router,
    private storage: LocalStorageService
  ) {}
  
  ngOnInit() {
   
    // Check authentication status on app initialization
    this.checkAuthStatus();
    
    // Listen to route changes to update auth status
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAuthStatus();
      });
  }

  /**
   * Check if user is authenticated by checking for auth token
   */
  private checkAuthStatus(): void {
    const token = this.storage.get('auth-key');
    this.isLoggedIn = !!token;
    
    // Hide navbar on login and register pages
    const currentUrl = this.router.url;
    if (currentUrl === '/login' || currentUrl === '/register' || currentUrl === '/') {
      this.isLoggedIn = false;
    }
  }

  /**
   * Open a BPMN XML file
   */
  openFile(event: Event): void {
    if (this.bpmnModeler) {
      this.bpmnModeler.onFileChange(event);
    }
  }

  /**
   * Export the current BPMN diagram as XML
   */
  exportXml(): void {
    if (this.bpmnModeler) {
      this.bpmnModeler.saveDiagram();
    }
  }
  
  /**
   * Logout user and redirect to login page
   */
  logout(): void {
    this.storage.remove('auth-key');
    this.isLoggedIn = false;
    this.router.navigateByUrl('/login');
  }
}