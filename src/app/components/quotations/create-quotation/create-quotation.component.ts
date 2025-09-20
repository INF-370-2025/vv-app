import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppModule } from '../../../app.module';
import { jobRequest } from '../../../models/jobRequest';
import { NotificationService } from '../../../services/notification.service';
import { ApiService } from '../../../services/api.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { SupabaseService } from '../../../services/supabase.service';
import { upsertQuotation } from '../../../models/quotation';

@Component({
  selector: 'app-create-quotation',
  standalone: true,
  imports: [AppModule],
  templateUrl: './create-quotation.component.html',
  styleUrl: './create-quotation.component.less'
})
export class CreateQuotationComponent {

  @Input() job_request : jobRequest = new jobRequest();
  @Output() createdQuote = new EventEmitter<number>();
  isloading = false;
  btnLoading:boolean = false;
  quoteForm: FormGroup = new FormGroup({
    quotation_number: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^Q\d+$/)
    ]),
    total_cost: new FormControl(null, [
      Validators.required,
      Validators.min(0.01)
    ]),
  });


  file!: NzUploadFile | undefined;
  fileList :any[] = [];

  constructor(private notification:NotificationService,public apiService:ApiService,private supabase:SupabaseService) {}

  ngOnInit(): void {

  }

  beforeUpload = (file: NzUploadFile,$event:any): boolean => {
    this.fileList = this.fileList.concat(file);
    this.file = this.fileList[0];
    return false;
  };

  async createQuote() {
    this.btnLoading = true;
    const file_url = await this.supabase.uploadFileToStorage(this.file!,"quotations");

    if(!this.quoteForm.valid) {
       Object.values(this.quoteForm.controls).forEach(control => {
            if (control.invalid) {
              control.markAsDirty();
              control.updateValueAndValidity({ onlySelf: true });
            }
      });
    } else {
      let quoteToInsert = new upsertQuotation();
      quoteToInsert.job_request_id = this.job_request.job_request_id;
      quoteToInsert.total_cost = this.quoteForm.value.total_cost;
      quoteToInsert.quotation_url = file_url;
      quoteToInsert.quotation_number = this.quoteForm.value.quotation_number;

        this.apiService.create_quotation(quoteToInsert).subscribe({
        next: res => {
          this.createdQuote.emit(this.job_request.job_request_id)
        },
        error: (error) => {
          this.notification.showError("An Error Occoured while processing your request");
          this.isloading = false;
        }
      });
    }
  }

}
