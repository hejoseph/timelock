import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-container">
      <header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <span class="title-icon">&#x2728;</span>
            TaskFlow Pro
            <span class="title-subtitle">Professional Task Management</span>
          </h1>
        </div>
      </header>

      <main class="app-main">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <p>Made with &#x2764;&#xFE0F; using Angular</p>
      </footer>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {}