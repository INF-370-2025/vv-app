import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppModule } from '../../../app.module';
import { jobCard } from '../../../models/jobCard';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { SupabaseService } from '../../../services/supabase.service';
import { stock } from '../../../models/stock';
import { employee } from '../../../models/user';
import { NzUploadFile } from 'ng-zorro-antd/upload';


@Component({
  selector: 'app-job-card-view',
  standalone: true,
  imports: [AppModule],
  templateUrl: './job-card-view.component.html',
  styleUrl: './job-card-view.component.less'
})
export class JobCardViewComponent implements OnInit {

  @Input() job_card : jobCard = new jobCard();
  @Output() closeView = new EventEmitter<number>();

  btnLoading:boolean = false;
  materials:stock[] = [];
  showMaterialModal:boolean = false;
  artisans:employee[] = [];
  showArtisanModal:boolean = false;

  file!: NzUploadFile | undefined;
  fileList :any[] = [];

  completionDate!: Date;

  constructor(private notification:NotificationService,public apiService:ApiService,private supabase:SupabaseService) {}

  ngOnInit(): void {
    console.log(this.job_card);
    this.completionDate = this.job_card.quotation?.job_request?.finish_date!;
  }

  openMaterialModal() {

  }

  addMaterial(stock_id:number) {

  }

  removeStockItem(stock_id:number) {

  }

  openArtisianModal() {

  }

  addArtisan(employee_id:number) {

  }

  removeEmployee(employee_id:number) {

  }

  beforeUpload = (file: NzUploadFile,$event:any): boolean => {
    this.fileList = this.fileList.concat(file);
    this.file = this.fileList[0];
    return false;
  };

  openMarkCompleted() {

  }

  viewQuote() {
    if (this.job_card.quotation?.quotation_url) {
      window.open(this.job_card.quotation?.quotation_url, '_blank');
    } else {
      this.notification.showError("PDF link is not available.");
    }
  }

  viewInvoice() {
    // if (this.job_card.invoice?.invoice_url) {
    //   window.open(this.job_card.invoice?.invoice_url, '_blank');
    // } else {
    //   this.notification.showError("PDF link is not available.");
    // }
  }


}
