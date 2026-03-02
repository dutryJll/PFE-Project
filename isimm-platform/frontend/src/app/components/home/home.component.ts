import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(private router: Router) {}

  goToChoix(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.router.navigate(['/choisir-candidature']);
  }

  goToMasters(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.router.navigate(['/masters']);
  }
}
