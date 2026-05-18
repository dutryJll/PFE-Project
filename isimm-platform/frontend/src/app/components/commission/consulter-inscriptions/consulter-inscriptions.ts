import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpecialitesService } from '../../../services/specialites.service';

@Component({
  selector: 'app-consulter-inscriptions',
  imports: [CommonModule, FormsModule],
  templateUrl: './consulter-inscriptions.html',
  styleUrl: './consulter-inscriptions.css',
})
export class ConsulterInscriptions implements OnInit {
  availableSpecialites: string[] = [];
  selectedSpecialite: string = '';

  constructor(private specialitesService: SpecialitesService) {}

  ngOnInit(): void {
    this.specialitesService.getSpecialitesData().subscribe(() => {
      this.availableSpecialites = this.specialitesService.getAllSpecialties();
    });
  }
}
