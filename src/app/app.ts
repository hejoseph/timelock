import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="app-container">
      <!-- Sidebar Toggle Button -->
      <button class="sidebar-toggle" (click)="toggleSidebar()" [class.active]="sidebarOpen()">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-header">
          <h1 class="app-title">
            <span class="title-icon">&#x2728;</span>
            TaskFlow Pro
          </h1>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/projects" 
             routerLinkActive="active" 
             class="nav-item"
             (click)="closeSidebarOnMobile()">
            <span class="nav-icon">&#x1F4C1;</span>
            Projects
          </a>
        </nav>

        <div class="sidebar-footer">
          <p>Made with &#x2764;&#xFE0F; using Angular</p>
        </div>
      </aside>

      <!-- Sidebar Overlay for mobile -->
      <div class="sidebar-overlay" 
           [class.active]="sidebarOpen()" 
           (click)="closeSidebar()"></div>

      <!-- Main Content -->
      <main class="app-main" [class.sidebar-open]="sidebarOpen()">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  sidebarOpen = signal(false);

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  closeSidebarOnMobile() {
    // Close sidebar on mobile when navigation item is clicked
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }
}