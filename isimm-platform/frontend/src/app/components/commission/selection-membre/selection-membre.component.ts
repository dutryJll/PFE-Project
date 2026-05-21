import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListePreselection } from '../liste-preselection/liste-preselection';

@Component({
  selector: 'app-selection-membre',
  standalone: true,
  imports: [CommonModule, ListePreselection],
  templateUrl: './selection-membre.component.html',
  styleUrl: './selection-membre.component.css',
})
export class SelectionMembreComponent {}
