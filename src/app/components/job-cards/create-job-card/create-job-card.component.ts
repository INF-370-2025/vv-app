import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { pattern, quotation, jobCardStatus } from '../../../models/jobCard';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AppModule } from '../../../app.module';
import { ActivatedRoute } from '@angular/router';

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
  @Input() invoiceId?: number;
  @Input() quotationId?: number;  @Output() closeForm = new EventEmitter<void>();
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
    private notification: NotificationService,
    private route: ActivatedRoute // Add this
  ) {
    this.jobCardForm = this.fb.group({
      pattern_id: [null],
      // quotation_id: [null, [Validators.required]],
      // job_card_status_id: [5, [Validators.required]],
      special_instructions: [''],
    });
  }

  ngOnInit(): void {
    this.jobCardForm = this.fb.group({
      pattern_id: [null], // Optional
      special_instructions: [''], // Optional
    });

    // Check for quotation ID in query params
    this.route.queryParams.subscribe(params => {
      if (params['quotationId']) {
        this.quotationId = +params['quotationId'];
      }
      if (params['invoiceId']) {
        this.invoiceId = +params['invoiceId'];
      }
    });
  }

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
        pattern_id: formValue.pattern_id ? Number(formValue.pattern_id) : null,
        quotation_id: this.quotationId, // From query params
        special_instructions: formValue.special_instructions || null,
        materials: this.materials.map(m => m.material_id),
        artisans: this.artisans.map(a => a.employee_id)
      };

      this.apiService.create_job_card(payload).subscribe({
        next: (newJobCard) => {
          // If we have an invoice ID, update the invoice with the job card ID
          if (this.invoiceId && newJobCard.job_card_id) {
            this.apiService.update_invoice_job_card(this.invoiceId, newJobCard.job_card_id).subscribe({
              next: () => {
                this.notification.showSuccess('Success', 'Job card created and invoice updated successfully');
                this.createSuccess.emit();
                this.isSubmitting = false;
                this.closeForm.emit();
              },
              error: (err) => {
                console.error('Error updating invoice:', err);
                this.notification.showError('Error', 'Job card created but failed to update invoice');
                this.createSuccess.emit();
                this.isSubmitting = false;
                this.closeForm.emit();
              }
            });
          } else {
            this.createSuccess.emit(newJobCard);
            this.isSubmitting = false;
            this.closeForm.emit();
          }
        },
        error: (err) => {
          console.error('Error creating job card:', err);
          this.notification.showError('Error', 'Failed to create job card');
          this.isSubmitting = false;
        }
      });
    }
  }


  updateInvoiceWithJobCard(invoiceId: number, jobCardId: number): void {
    this.apiService.update_invoice_job_card(invoiceId, jobCardId).subscribe({
      next: () => {
        this.notification.showSuccess('Success', 'Invoice updated with job card reference');
        this.createSuccess.emit();
        this.isSubmitting = false;
        this.closeForm.emit();
      },
      error: (err) => {
        console.error('Error updating invoice:', err);
        this.notification.showError('Error', 'Job card created but failed to update invoice');
        this.createSuccess.emit();
        this.isSubmitting = false;
        this.closeForm.emit();
      }
    });
  }

  cancel(): void {
    this.closeForm.emit();
  }
}
