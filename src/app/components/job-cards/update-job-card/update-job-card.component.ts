import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { jobCard, jobCardStatus, pattern, quotation } from '../../../models/jobCard';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AppModule } from '../../../app.module';
import { NzSelectOptionInterface } from 'ng-zorro-antd/select';


@Component({
  selector: 'app-update-job-card',
  standalone: true,
  imports: [AppModule],
  templateUrl: './update-job-card.component.html',
  styleUrls: ['./update-job-card.component.less']
})
export class UpdateJobCardComponent implements OnInit {
  @Input() jobCardData: jobCard | null = null;
  @Input() jobCardStatuses: jobCardStatus[] = [];
  @Input() patterns: pattern[] = [];
  @Input() quotations: quotation[] = [];
  @Output() closeForm = new EventEmitter<void>();
  @Output() updateSuccess = new EventEmitter<jobCard>();

  jobCardForm: FormGroup;
  isSubmitting = false;
  materials: any[] = [];
  artisans: any[] = [];
  allMaterials: any[] = [];
  allArtisans: any[] = [];
  showMaterialModal = false;
  showArtisanModal = false;
  selectedMaterial: any = null;
  selectedArtisan: any = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService
  ) {
    this.jobCardForm = this.fb.group({
      job_card_id: ['', Validators.required],
      pattern_id: [null, [Validators.required]],
      job_card_status_id: [null, [Validators.required]],
      quotation_id: [null, [Validators.required]],
      special_instructions: [''],
      completed_at: [null, [this.futureDateValidator]]
    });
  }

ngOnInit(): void {
  console.log('Job card data received:', this.jobCardData);
  this.populateForm();

  // Debug: Log form values after population
  setTimeout(() => {
    console.log('Form values after populate:', this.jobCardForm.value);
    console.log('Completed_at control value:', this.jobCardForm.get('completed_at')?.value);
  }, 100);

  this.loadMaterials();
  this.loadArtisans();
  this.loadAllMaterials();
  this.loadAllArtisans();
}

futureDateValidator(control: AbstractControl): { [key: string]: any } | null {
  if (!control.value) return null;

  // Handle both Date objects and string inputs
  const dateValue = control.value instanceof Date ?
                    control.value :
                    new Date(control.value);

  // If it's an invalid date, return error
  if (isNaN(dateValue.getTime())) {
    return { invalidDate: true };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compare just the date portion
  const selectedDate = new Date(
    dateValue.getFullYear(),
    dateValue.getMonth(),
    dateValue.getDate()
  );

  if (selectedDate < today) {
    return { pastDate: true };
  }

  return null;
}
  // Add these methods to your component class
  compareMaterials(m1: any, m2: any): boolean {
    return m1 && m2 ? m1.material_id === m2.material_id : m1 === m2;
  }

  compareArtisans(a1: any, a2: any): boolean {
    return a1 && a2 ? a1.employee_id === a2.employee_id : a1 === a2;
  }

    addSelectedMaterial(): void {
    if (this.selectedMaterial && !this.materials.some(m => m.material_id === this.selectedMaterial.material_id)) {
      this.materials.push(this.selectedMaterial);
      this.selectedMaterial = null;
    }
  }

  addSelectedArtisan(): void {
    if (this.selectedArtisan && !this.artisans.some(a => a.employee_id === this.selectedArtisan.employee_id)) {
      this.artisans.push(this.selectedArtisan);
      this.selectedArtisan = null;
    }
  }

populateForm(): void {
  if (this.jobCardData) {
    // Handle completion date conversion
    let completedAt = null;

    // Check if we have a valid date string
    if (this.jobCardData.completed_at && typeof this.jobCardData.completed_at === 'string') {
      // Parse the date string to a Date object
      completedAt = new Date(this.jobCardData.completed_at);

      // Validate the parsed date
      if (isNaN(completedAt.getTime())) {
        console.error('Invalid date format:', this.jobCardData.completed_at);
        completedAt = null;
      }
    }

    this.jobCardForm.patchValue({
      job_card_id: this.jobCardData.job_card_id,
      pattern_id: this.jobCardData.pattern_id,
      job_card_status_id: this.jobCardData.job_card_status_id,
      quotation_id: this.jobCardData.quotation_id,
      special_instructions: this.jobCardData.special_instructions || '',
      completed_at: completedAt
    });
  }
}

  loadMaterials(): void {
    if (this.jobCardData?.job_card_id) {
      this.apiService.get_job_card_with_materials(this.jobCardData.job_card_id)
        .subscribe({
          next: (res) => {
            this.materials = res.materials || [];
          },
          error: (err) => console.error('Error loading materials:', err)
        });
    }
  }

  loadArtisans(): void {
    // Load artisans from your existing implementation
    if (this.jobCardData?.job_card_artisans) {
      this.artisans = this.jobCardData.job_card_artisans.map(a => ({
        employee_id: a.employee.employee_id,
        name: a.employee.user?.name,
        surname: a.employee.user?.surname
      }));
    }
  }

loadAllMaterials(): void {
  this.apiService.get_materials().subscribe({
    next: (res) => {
      console.log('Materials response:', res);
      // Assign directly without mapping
      this.allMaterials = res;
    },
    error: (err) => console.error('Error loading materials:', err)
  });
}

loadAllArtisans(): void {
  this.apiService.get_artisans().subscribe({
    next: (res) => {
      console.log('Artisans response:', res);
      // Assign directly without mapping
      this.allArtisans = res;
    },
    error: (err) => console.error('Error loading artisans:', err)
  });
}



  openMaterialModal(): void {
    this.showMaterialModal = true;
  }

  closeMaterialModal(): void {
    this.showMaterialModal = false;
  }

  openArtisanModal(): void {
    this.showArtisanModal = true;
  }

  closeArtisanModal(): void {
    this.showArtisanModal = false;
  }

  addMaterial(material: any): void {
    if (!this.materials.some(m => m.material_id === material.material_id)) {
      this.materials.push(material);
      this.markFormAsDirty();
    }
  }

  removeMaterial(material_id: number): void {
    this.materials = this.materials.filter(m => m.material_id !== material_id);
    this.markFormAsDirty();
  }

  addArtisan(artisan: any): void {
    if (!this.artisans.some(a => a.employee_id === artisan.employee_id)) {
      this.artisans.push(artisan);
      this.markFormAsDirty();
    }
  }

  removeArtisan(employee_id: number): void {
    this.artisans = this.artisans.filter(a => a.employee_id !== employee_id);
    this.markFormAsDirty();
  }

  markFormAsDirty(): void {
    this.jobCardForm.markAsDirty();
  }

  submitForm(): void {
    if (this.jobCardForm.valid) {
      this.isSubmitting = true;

      const formValue = this.jobCardForm.value;
      const payload = {
        ...formValue,
        materials: this.materials.map(m => m.material_id),
        artisans: this.artisans.map(a => a.employee_id)
      };

      // Format completion date if exists
      if (payload.completed_at) {
        payload.completed_at = new Date(payload.completed_at).toISOString().split('T')[0];
      }

      this.apiService.update_job_card(formValue.job_card_id, payload).subscribe({
        next: (updatedJobCard) => {
          this.notification.showSuccess('Success', 'Job card updated successfully');
          this.updateSuccess.emit(updatedJobCard);
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Error updating job card:', err);
          this.notification.showError('Error', 'Failed to update job card');
          this.isSubmitting = false;
        }
      });
    }
  }

  cancel(): void {
    this.closeForm.emit();
  }
}
