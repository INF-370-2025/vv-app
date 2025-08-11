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
import html2canvas from 'html2canvas';
import { quotation } from '../../models/quotation';
import { QuotationsReportComponent } from './quotations-report/quotations-report.component';
import { PendingQuotesComponent } from './pending-quotes/pending-quotes.component';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AppModule, RouterLink, TimesheetCalanderComponent, MonthlyHoursWorkedComponent, LowStockComponent, StockReportComponent, UnpaidInvoicesComponent, QuotationsReportComponent, PendingQuotesComponent],
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
  helpText = '';
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
      top: '5vh',               // 5% from top
      width: '90vw',            // 90% of viewport width
      height: '90vh',           // 90% of viewport height
      maxWidth: '90vw'
    },
    nzBodyStyle: {
      height: 'calc(90vh - 55px)', // subtract header height for scroll
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
      this.getJobs();
      this.getStock();
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

  getJobs() {
  this.apiService.get_job_cards().subscribe({
    next: res => {
      this.jobCards = res as jobCard[];
      this.isloadingCard = false;

      const statusLabels = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
      const statusColors: { [key: string]: string } = {
        'Pending': 'rgba(255, 165, 0, 1)',         // Orange
        'In Progress': 'rgba(135, 206, 250, 1)',   // Light Blue
        'Completed': 'rgba(0, 128, 0, 1)',         // Green
        'Cancelled': 'rgba(255, 0, 0, 1)'          // Red
      };

      const statusCountMap: { [key: string]: number } = {
        'Pending': 0,
        'In Progress': 0,
        'Completed': 0,
        'Cancelled': 0
      };

      this.jobCards.forEach(card => {
        const status = card.job_card_status?.status;
        if (status! in statusCountMap) {
          statusCountMap[status!]++;
        }
      });

      const labels = statusLabels;
      const data = labels.map(label => statusCountMap[label]);
      const backgroundColors = labels.map(label => statusColors[label]);

      let delayed: any;
      this.chart_jobs?.destroy();

      // Create bar chart instead of doughnut
      this.chart_jobs = new Chart('canvas_jobs', {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Job Count',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('1)', '0.8)')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y', // Horizontal bars
          plugins: {
            legend: {
              display: false // Hide legend for cleaner look
            },
            title: {
              display: true,
              text: 'Jobs By Status',
              font: {
                size: 16
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.parsed.x} jobs`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Jobs'
              }
            },
            y: {
              grid: {
                display: false // Remove horizontal grid lines
              }
            }
          },
          animation: {
            onComplete: () => {
              delayed = true;
            },
            delay: (context) => {
              let delay = 0;
              if (context.type === 'data' && context.mode === 'default' && !delayed) {
                delay = context.dataIndex * 300;
              }
              return delay;
            },
          },
        }
      });
    },
    error: (error) => {
      this.notification.showError("An Error Occurred while processing your request");
      this.isloadingCard = false;
    }
  });
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


  async exportPendingQuotationsToPDF() {
    this.isExportingPending = true;

    try {
      const content = this.pendingQuotationsReportContent.nativeElement;
      const clone = content.cloneNode(true);

      // Create temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      // Add logo
      const logo = document.createElement('img');
      logo.src = 'assets/images/logo.png';
      logo.style.width = '150px';
      logo.style.marginBottom = '20px';
      clone.insertBefore(logo, clone.firstChild);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const scale = 2;

      const canvas = await html2canvas(clone, {
        scale: scale,
        useCORS: true
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const imgAspectRatio = imgWidth / imgHeight;
      const pageAspectRatio = pageWidth / pageHeight;

      let renderWidth, renderHeight;

      if (imgAspectRatio > pageAspectRatio) {
        renderWidth = pageWidth;
        renderHeight = pageWidth / imgAspectRatio;
      } else {
        renderHeight = pageHeight;
        renderWidth = pageHeight * imgAspectRatio;
      }

      const pages = Math.ceil(renderHeight / pageHeight);

      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          margin - (i * pageHeight),
          renderWidth,
          renderHeight
        );
      }

      pdf.save(`pending-quotations-${new Date().toISOString().slice(0, 10)}.pdf`);

    } catch (error) {
      console.error('Export error:', error);
      this.notification.showError('Export Failed', 'Could not generate PDF');
    } finally {
      this.isExportingPending = false;
    }
  }




      openStockReport(): void {
    this.modal.create({
      nzTitle: 'Stock Inventory Report',
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
      nzTitle: 'Pending Quotations Report',
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
    nzTitle: 'Unpaid Invoices Report',
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
    nzTitle: 'Quotattion Summary Report',
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

openAdminHelpModal() {
  this.helpText = '';
  this.showAdminHelpModal = true;
}

openEmployeeHelpModal() {
  this.helpText = '';
  this.showEmployeeHelpModal = true;
}

openCustomerHelpModal() {
  this.helpText = '';
  this.showCustomerHelpModal = true;
}
}
//npm install chart.js
