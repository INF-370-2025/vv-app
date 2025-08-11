import { jsPDF } from 'jspdf';
import { MonthlyHoursWorkedComponent } from './monthly-hours-worked/monthly-hours-worked.component';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { AppModule } from '../../app.module';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { stock, StockDetails } from '../../models/stock';
import { jobCard } from '../../models/jobCard';
import { adminStats, artisanStats } from '../../models/general';
import { RouterLink } from '@angular/router';
import { TimesheetCalanderComponent } from '../employee/timesheet-calander/timesheet-calander.component';
import { NzModalService } from 'ng-zorro-antd/modal'; // Added
import { LowStockComponent } from './low-stock/low-stock.component';
import { StockReportComponent } from './stock-report/stock-report.component';
import { UnpaidInvoicesComponent } from './unpaid-invoices/unpaid-invoices.component';
import { quotation } from '../../models/quotation';
import { QuotationsReportComponent } from './quotations-report/quotations-report.component';
import { PendingQuotesComponent } from './pending-quotes/pending-quotes.component';
import { JobCardsReportComponent } from './job-cards-report/job-cards-report.component';
import { StockTypeReportComponent } from './stock-type-report/stock-type-report.component';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AppModule,
    RouterLink,
    TimesheetCalanderComponent,
    MonthlyHoursWorkedComponent,
    LowStockComponent,
    StockReportComponent,
    UnpaidInvoicesComponent,
    QuotationsReportComponent,
    PendingQuotesComponent,
    JobCardsReportComponent,
    StockTypeReportComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.less'
})
export class DashboardComponent {
  @ViewChild('pendingQuotationsReportContent') pendingQuotationsReportContent!: ElementRef;
  isExportingPending = false;
  isloading:boolean = false;
  isloadingCard:boolean = false;
  isloadingCard1:boolean = false;
  chart_levels!:any;
  chart_jobs!:any;
  stock:stock[] = [];
  jobCards:jobCard[] = [];
  adminStats?:adminStats;
  artisanStats?:artisanStats;
  currentDate: Date = new Date();
  generatedBy: string = '';
  stockTypes: any[] = [];
  selectedStockTypeId: number | null = null;
  isStockTypesLoading = false;
  showAdminHelpModal = false;
  showCustomerHelpModal = false;
  showEmployeeHelpModal = false;

  quotations: quotation[] = [];
  pending: quotation[] = [];
  showPendingQuotationsModal:boolean = false;

    constructor(
    private apiService: ApiService,
    private modal: NzModalService,
    private notification: NotificationService,
    public authService: AuthService
  ) {
    this.generatedBy = this.authService.user?.name || '';
  }


  ngOnInit(): void {
    this.isloading = true;
    this.isloadingCard = true;
    this.isloadingCard1 = true;
    this.loadStockTypes();
    this.setData();
  }

openMonthlyHoursReport(): void {
  this.modal.create({
    nzTitle: 'Monthly Hours Worked Report',
    nzContent: MonthlyHoursWorkedComponent,
    nzFooter: null,
    nzClosable: true,
    nzMaskClosable: true,
    nzStyle: {
      top: '5vh',
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw'
    },
    nzBodyStyle: {
      height: 'calc(90vh - 55px)',
      overflow: 'auto',
      padding: '0'
    },
    nzWidth: '90vw'
  });
}



  setData() {
    console.log(this.authService.user?.role_id)
    if(this.authService.user?.role_id == 1) {
      this.getAdminStats();
      // this.getJobs();
      // this.getStock();
    }
    if(this.authService.user?.role_id == 5) {
       this.getArtisanStats();
    }
  }

  getAdminStats() {
    this.apiService.getAdminStats().subscribe({
      next: res => {
        this.adminStats = res as adminStats;
        this.isloading = false;
        console.log(this.adminStats);
      },
      error: (error) => {
        this.notification.showError("An Error Occoured while processing your request");
      this.isloading = false;
      }
    });
  }

  getArtisanStats() {
    this.artisanStats = new artisanStats();
    this.artisanStats.jobs_completed = 5;
    this.artisanStats.hours_worked = 135;
    this.artisanStats.accumulated_pay = 22354.58;
    this.isloading = false;
    // this.apiService.getArtisanStats(this.authService.user?.user_id!).subscribe({
    //   next: res => {
    //     this.artisanStats = res as artisanStats;
    //     this.isloading = false;
    //     console.log(this.artisanStats);
    //   },
    //   error: (error) => {
    //     this.notification.showError("An Error Occoured while processing your request");
    //   this.isloading = false;
    //   }
    // });
  }


loadStockTypes() {
  this.isStockTypesLoading = true;
  this.apiService.get_stock_types().subscribe({
    next: (res) => {
      // Map the response to use 'name' property instead of 'type_name'
      this.stockTypes = res.map((type: { stock_type_id: any; type_name: any; created_at: any; }) => ({
        stock_type_id: type.stock_type_id,
        name: type.type_name,  // Use type_name as name
        created_at: type.created_at
      }));
      this.isStockTypesLoading = false;
    },
    error: (err) => {
      console.error('Error loading stock types:', err);
      this.isStockTypesLoading = false;
    }
  });
}

  getStock(stockTypeId?: number) {
    this.isloadingCard1 = true;
    this.apiService.get_all_stock().subscribe({
      next: res => {
        let stock = res as StockDetails[];
        this.stock = stock.flatMap(x => x.stock_details as unknown as stock);

        // Apply stock type filter if selected
        if (stockTypeId) {
          this.stock = this.stock.filter(item =>
            item.stock_type?.stock_type_id === stockTypeId
          );
        }

        // Sort and prepare chart data
        const sortedStock = this.stock
          .sort((a, b) => a.stock_level - b.stock_level)
          .slice(0, 10);

        const labels = sortedStock.map(x => x.name);
        const data = sortedStock.map(x => x.stock_level);
        const backgroundColors = sortedStock.map(x =>
          x.stock_level > 10 ? '#17726d' : '#FF0000'
        );

        this.updateStockChart(labels, data, backgroundColors);
        this.isloadingCard1 = false;
      },
      error: (error) => {
        this.notification.showError("An Error Occurred while processing your request");
        this.isloadingCard1 = false;
      }
    });
  }

  updateStockChart(labels: string[], data: number[], backgroundColors: string[]) {
  let delayed: any;

  if (this.chart_levels) {
    this.chart_levels.destroy();
  }

  this.chart_levels = new Chart('canvas_levels', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Stock Level',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Stock Items'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Quantity in Stock'
          }
        },
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: this.selectedStockTypeId
            ? `Stock Levels (${this.getStockTypeName()})`
            : 'Top 10 Stock Levels (All Types)'
        }
      },
      animation: {
        onComplete: () => delayed = true,
        delay: (context) => {
          return context.type === 'data' && context.mode === 'default' && !delayed
            ? context.dataIndex * 300
            : 0;
        },
      },
    }
  });
}

getStockTypeName(): string {
  const type = this.stockTypes.find(t => t.stock_type_id === this.selectedStockTypeId);
  return type ? type.name : 'Selected Type';
}

  onStockTypeChange(event: Event | number) {
    const typeId = typeof event === 'number' ? event : Number((event.target as HTMLSelectElement).value);

    if (typeId) {
      this.selectedStockTypeId = typeId;
      this.getStock(typeId);
    }
  }

  clearStockTypeFilter() {
    this.selectedStockTypeId = null;
    this.getStock();
  }

    openLowStockReport(): void {
      this.modal.create({
        nzTitle: 'Low Stock Report',
        nzContent: LowStockComponent,
        nzFooter: null,
        nzClosable: true,
        nzMaskClosable: true,
        nzStyle: {
          top: '5vh',
          width: '90vw',
          height: '90vh',
          maxWidth: '90vw'
        },
        nzBodyStyle: {
          height: 'calc(90vh - 55px)',
          overflow: 'auto',
          padding: '0'
        },
        nzWidth: '90vw'
      });
    }

  loadQuotations(): void {
    this.isloading = true;
    this.currentDate = new Date();
    this.apiService.get_quotations().subscribe({
      next: (response) => {
        this.quotations = ([...response] as quotation[]).sort((a,b) => b.quotation_id - a.quotation_id);
        this.pending = this.quotations.filter(x => x.quotation_status?.quotation_status_id === 1);
        this.isloading = false;
      },
      error: (err) => {
        console.error('Error loading quotations:', err);
        this.isloading = false;
      }
    });
  }

  viewPendingQuotationsReport() {
    this.showPendingQuotationsModal = true;
    this.loadQuotations();
  }







      openStockReport(): void {
    this.modal.create({
      nzContent: StockReportComponent,
      nzFooter: null,
      nzClosable: true,
      nzMaskClosable: true,
      nzStyle: {
        top: '5vh',
        width: '90vw',
        height: '90vh',
        maxWidth: '90vw'
      },
      nzBodyStyle: {
        height: 'calc(90vh - 55px)',
        overflow: 'auto',
        padding: '0'
      },
      nzWidth: '90vw'
    });
  }

  openPendingQuotesReport(): void {
    this.modal.create({
      nzContent: PendingQuotesComponent,
      nzFooter: null,
      nzClosable: true,
      nzMaskClosable: true,
      nzStyle: {
        top: '5vh',
        width: '90vw',
        height: '90vh',
        maxWidth: '90vw'
      },
      nzBodyStyle: {
        height: 'calc(90vh - 55px)',
        overflow: 'auto',
        padding: '0'
      },
      nzWidth: '90vw'
    });
  }

  openUnpaidInvoicesReport(): void {
  this.modal.create({
    nzContent: UnpaidInvoicesComponent,
    nzFooter: null,
    nzClosable: true,
    nzMaskClosable: true,
    nzStyle: {
      top: '5vh',
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw'
    },
    nzBodyStyle: {
      height: 'calc(90vh - 55px)',
      overflow: 'auto',
      padding: '0'
    },
    nzWidth: '90vw'
  });

  }
  openQuotationsReport(): void {
  this.modal.create({
    nzContent: QuotationsReportComponent,
    nzFooter: null,
    nzClosable: true,
    nzMaskClosable: true,
    nzStyle: {
      top: '5vh',
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw'
    },
    nzBodyStyle: {
      height: 'calc(90vh - 55px)',
      overflow: 'auto',
      padding: '0'
    },
    nzWidth: '90vw'
  });
}

  openJobCardsByStatusReport(): void {
  this.modal.create({
    nzContent: JobCardsReportComponent,
    nzFooter: null,
    nzClosable: true,
    nzMaskClosable: true,
    nzStyle: {
      top: '5vh',
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw'
    },
    nzBodyStyle: {
      height: 'calc(90vh - 55px)',
      overflow: 'auto',
      padding: '0'
    },
    nzWidth: '90vw'
  });
}


openStockByTypeReport(): void {
  this.modal.create({
    nzContent: StockTypeReportComponent,
    nzFooter: null,
    nzClosable: true,
    nzMaskClosable: true,
    nzStyle: {
      top: '5vh',
      width: '90vw',
      height: '90vh',
      maxWidth: '90vw'
    },
    nzBodyStyle: {
      height: 'calc(90vh - 55px)',
      overflow: 'auto',
      padding: '0'
    },
    nzWidth: '90vw'
  });
}

openAdminHelpModal() {
  this.showAdminHelpModal = true;
}

openEmployeeHelpModal() {
  this.showEmployeeHelpModal = true;
}

openCustomerHelpModal() {
  this.showCustomerHelpModal = true;
}
}
//npm install chart.js
