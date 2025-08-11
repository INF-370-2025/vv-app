import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { pattern, quotation, jobCardStatus } from '../../../models/jobCard';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AppModule } from '../../../app.module';

@Component({
  standalone: true,
  imports: [AppModule],
  selector: 'app-create-job-card',
  templateUrl: './create-job-card.component.html',
  styleUrls: ['./create-job-card.component.less']
})
export class CreateJobCardComponent implements OnInit {
  @Input() patterns: pattern[] = [];
  @Input() quotations: quotation[] = [];
  @Input() jobCardStatuses: jobCardStatus[] = [];
  @Input() allMaterials: any[] = [];
  @Input() allArtisans: any[] = [];
  @Output() closeForm = new EventEmitter<void>();
  @Output() createSuccess = new EventEmitter<any>();

  jobCardForm: FormGroup;
  isSubmitting = false;
  materials: any[] = [];
  artisans: any[] = [];
  selectedMaterial: any = null;
  selectedArtisan: any = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService
  ) {
    this.jobCardForm = this.fb.group({
      pattern_id: [null, [Validators.required]],
      quotation_id: [null, [Validators.required]],
      job_card_status_id: [5, [Validators.required]],
      special_instructions: [''],
    });
  }

  ngOnInit(): void {}

  futureDateValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;

    const dateValue = control.value instanceof Date ?
                      control.value :
                      new Date(control.value);

    if (isNaN(dateValue.getTime())) {
      return { invalidDate: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

  addMaterial(): void {
    if (this.selectedMaterial && !this.materials.some(m => m.material_id === this.selectedMaterial.material_id)) {
      this.materials.push(this.selectedMaterial);
      this.selectedMaterial = null;
    }
  }

  removeMaterial(material_id: number): void {
    this.materials = this.materials.filter(m => m.material_id !== material_id);
  }

  addArtisan(): void {
    if (this.selectedArtisan && !this.artisans.some(a => a.employee_id === this.selectedArtisan.employee_id)) {
      this.artisans.push(this.selectedArtisan);
      this.selectedArtisan = null;
    }
  }

  removeArtisan(employee_id: number): void {
    this.artisans = this.artisans.filter(a => a.employee_id !== employee_id);
  }

submitForm(): void {
  if (this.jobCardForm.valid) {
    this.isSubmitting = true;

    const formValue = this.jobCardForm.value;

    const payload = {
      pattern_id: Number(formValue.pattern_id),
      quotation_id: Number(formValue.quotation_id),
      job_card_status_id: Number(formValue.job_card_status_id),
      special_instructions: formValue.special_instructions || null,
      materials: this.materials.map(m => m.material_id),
      artisans: this.artisans.map(a => a.employee_id)
    };

    console.log('Create job card payload:', payload);

    this.apiService.create_job_card(payload).subscribe({
      next: (newJobCard) => {
        this.notification.showSuccess('Success', 'Job card created successfully');
        this.createSuccess.emit(newJobCard);
        this.isSubmitting = false;
        this.closeForm.emit();
      },
      error: (err) => {
        console.error('Error creating job card:', err);
        console.error('Error details:', err.error);

        if (err.error?.detail) {
          const errorMessage = err.error.detail.map((d: any) => d.msg).join(', ');
          this.notification.showError('Validation Error', errorMessage);
        } else {
          this.notification.showError('Error', 'Failed to create job card');
        }

        this.isSubmitting = false;
      }
    });
  }
}

  cancel(): void {
    this.closeForm.emit();
  }
}
