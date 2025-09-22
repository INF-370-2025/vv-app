import { jsPDF } from 'jspdf';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import { AppModule } from '../../app.module';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { NzModalService } from 'ng-zorro-antd/modal';

import { stock, StockDetails } from '../../models/stock';
import { jobCard } from '../../models/jobCard';
import { artisanStats } from '../../models/general';
import { quotation } from '../../models/quotation';

import { MonthlyHoursWorkedComponent } from './monthly-hours-worked/monthly-hours-worked.component';
import { TimesheetCalanderComponent } from '../employee/timesheet-calander/timesheet-calander.component';
import { LowStockComponent } from './low-stock/low-stock.component';
import { StockReportComponent } from './stock-report/stock-report.component';
import { UnpaidInvoicesComponent } from './unpaid-invoices/unpaid-invoices.component';
import { QuotationsReportComponent } from './quotations-report/quotations-report.component';
import { PendingQuotesComponent } from './pending-quotes/pending-quotes.component';
import { JobCardsReportComponent } from './job-cards-report/job-cards-report.component';
import { StockTypeReportComponent } from './stock-type-report/stock-type-report.component';
import { PendingJobRequestsComponent } from './pending-job-requests/pending-job-requests.component';
import { RevenueComponent } from './revenue/revenue.component';


export interface adminStats {
  new_requests: number;
  completed_job_cards_week: number;
  total_customers: number;
  low_stock_items: number;
  pending_quotations?: number;
  unpaid_invoices?: number;
  employees_clocked_in_today?: number;
  pending_job_cards?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AppModule,
    RouterLink,
    TimesheetCalanderComponent,
    MonthlyHoursWorkedComponent,
    LowStockComponent,
    StockReportComponent,
    UnpaidInvoicesComponent,
    QuotationsReportComponent,
    PendingQuotesComponent,
    JobCardsReportComponent,
    StockTypeReportComponent,
    PendingJobRequestsComponent,
    RevenueComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.less'
})


export class DashboardComponent {
  @ViewChild('pendingQuotationsReportContent') pendingQuotationsReportContent!: ElementRef;

  isExportingPending = false;
  isloading: boolean = false;
  isloadingCard: boolean = false;
  isloadingCard1: boolean = false;
  isStockTypesLoading = false;


  chart_levels!: any;
  chart_jobs!: any;
  jobRequestChart: any;
  performanceTrendChart: any;
  currentTrendMetric: string = 'requests';


  stock: stock[] = [];
  jobCards: jobCard[] = [];
  adminStats?: adminStats;
  artisanStats?: artisanStats;
  stockTypes: any[] = [];
  selectedStockTypeId: number | null = null;

  quotations: quotation[] = [];
  pending: quotation[] = [];


  currentDate: Date = new Date();
  generatedBy: string = '';


  showAdminHelpModal = false;
  showCustomerHelpModal = false;
  showEmployeeHelpModal = false;
  showPendingQuotationsModal: boolean = false;

  completionTimelineChart: any;
  isLoadingTimeline: boolean = false;
  completionTimeline: any[] = [];

  lowStockChart: any;
  lowStockItems: any[] = [];





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
    this.loadLowStockData();

    setTimeout(() => {
      this.initCharts();
    }, 500);
  }

  loadLowStockData(): void {
    this.isloadingCard1 = true;
    this.apiService.get_all_stock().subscribe({
      next: res => {
        let stock = res as StockDetails[];
        this.stock = stock.flatMap(x => x.stock_details as unknown as stock);

        // Get top 10 lowest stock items
        const sortedStock = this.stock
          .sort((a, b) => a.stock_level - b.stock_level)
          .slice(0, 10);

        this.lowStockItems = sortedStock;

        const labels = sortedStock.map(x => x.name);
        const data = sortedStock.map(x => x.stock_level);
        const backgroundColors = sortedStock.map(x =>
          x.stock_level > 10 ? '#17726d' : '#FF0000'
        );

        this.createLowStockChart(labels, data, backgroundColors);
        this.isloadingCard1 = false;
      },
      error: (error) => {
        this.notification.showError("An Error Occurred while loading stock data");
        this.isloadingCard1 = false;
      }
    });
  }

  createLowStockChart(labels: string[], data: number[], backgroundColors: string[]): void {
    const ctx = document.getElementById('lowStockChart') as HTMLCanvasElement;

    if (this.lowStockChart) {
      this.lowStockChart.destroy();
    }

    this.lowStockChart = new Chart(ctx, {
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
        maintainAspectRatio: false,
        indexAxis: 'y', // Horizontal bars
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantity in Stock'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Stock Items'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top 10 Lowest Stock Items'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Stock Level: ${context.parsed.x}`;
              }
            }
          }
        }
      }
    });
  }

  refreshStockChart(): void {
    this.loadLowStockData();
  }



  loadCompletionTimeline(): void {
    this.isLoadingTimeline = true;
    this.apiService.getJobCompletionTimeline().subscribe({
      next: (response) => {
        console.log('API Response:', response);
        console.log('Response type:', typeof response);

        if (Array.isArray(response)) {
          console.log('Response is an array with length:', response.length);
          this.completionTimeline = response;
          this.createCompletionTimelineChart(this.completionTimeline);
        } else if (response && Array.isArray(response.data)) {
          console.log('Response has data property that is an array');
          this.completionTimeline = response.data;
          this.createCompletionTimelineChart(this.completionTimeline);
        } else if (response && response.error) {
          // Handle error response
          console.error('API returned error:', response.error);
          this.notification.showError("Server error: " + response.error);
          this.createCompletionTimelineChart([]);
        } else {
          console.error('Unexpected response format:', response);
          this.notification.showError("Unexpected data format received from server");

          this.createCompletionTimelineChart([]);
        }
        this.isLoadingTimeline = false;
      },
      error: (error) => {
        console.error('Error loading completion timeline:', error);
        this.isLoadingTimeline = false;
        this.notification.showError("Failed to load completion timeline data");

        this.createCompletionTimelineChart([]);
      }
    });
  }

  createCompletionTimelineChart(data: any[]): void {
    const ctx = document.getElementById('completionTimelineChart') as HTMLCanvasElement;

    if (this.completionTimelineChart) {
      this.completionTimelineChart.destroy();
    }

    // Process data for chart - ensure we have numbers, not null values
    const months = data.map(item => item.month);
    const onTimeData = data.map(item => item.on_time || 0); // Default to 0 if null
    const delayedData = data.map(item => item.delayed || 0); // Default to 0 if null

    this.completionTimelineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Completed On Time',
            data: onTimeData,
            backgroundColor: '#38d550ff',
            stack: 'Stack 0'
          },
          {
            label: 'Delayed',
            data: delayedData,
            backgroundColor: '#e3574dff',
            stack: 'Stack 0'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Months'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Job Cards'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Job Card Completion Timeline (Last 6 Months)'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                // Safely calculate total
                const datasets = context.chart.data.datasets;
                let total = 0;
                if (datasets && datasets.length > 0) {
                  total = datasets
                    .map((dataset: any) => dataset.data[context.dataIndex] as number || 0)
                    .reduce((a: number, b: number) => a + b, 0);
                }
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }


  initCharts(): void {
    this.createJobRequestStatusChart();
    this.createPerformanceTrendChart();
  }

  createJobRequestStatusChart(): void {
    const ctx = document.getElementById('jobRequestChart') as HTMLCanvasElement;

    if (this.jobRequestChart) this.jobRequestChart.destroy();

    const statusData = { 'Pending': 15, 'In Progress': 8, 'Completed': 12, 'Cancelled': 3 };

    this.jobRequestChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(statusData),
        datasets: [{
          data: Object.values(statusData),
          backgroundColor: ['#FF6384','#36A2EB','#4BC0C0','#FFCE56'],
          hoverBackgroundColor: ['#FF6384','#36A2EB','#4BC0C0','#FFCE56']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = Number(context.raw) || 0;
                const dataArray = context.dataset.data as number[];
                const total = dataArray.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  createPerformanceTrendChart(): void {
    const ctx = document.getElementById('performanceTrendChart') as HTMLCanvasElement;

    if (this.performanceTrendChart) this.performanceTrendChart.destroy();

    const months = ['Jan','Feb','Mar','Apr','May','Jun'];
    const requestData = [45,52,38,65,72,60];
    const quotationData = [30,40,35,50,45,55];
    const completedData = [25,30,28,40,38,45];

    let dataToUse;
    let labelText;

    switch(this.currentTrendMetric) {
      case 'quotations': dataToUse = quotationData; labelText = 'Quotations Generated'; break;
      case 'completed': dataToUse = completedData; labelText = 'Jobs Completed'; break;
      default: dataToUse = requestData; labelText = 'Job Requests';
    }

    this.performanceTrendChart = new Chart(ctx, {
      type: 'line',
      data: { labels: months, datasets: [{ label: labelText, data: dataToUse, fill: false, borderColor: '#17726d', tension: 0.1, pointBackgroundColor: '#17726d', pointRadius: 4, pointHoverRadius: 6 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Count' } },
          x: { title: { display: true, text: 'Month' } }
        }
      }
    });
  }

  refreshJobRequestChart(): void { this.createJobRequestStatusChart(); }
  refreshTrendChart(): void { this.createPerformanceTrendChart(); }
  changeTrendMetric(metric: string): void { this.currentTrendMetric = metric; this.createPerformanceTrendChart(); }


  getAdminStats() {
    this.apiService.getAdminStats().subscribe({
      next: res => {
        this.adminStats = res as adminStats;

        // If low_stock_items isn't provided by the API, calculate it
        if (this.adminStats.low_stock_items === undefined && this.stock.length > 0) {
          this.adminStats.low_stock_items = this.stock.filter(item => item.stock_level <= 10).length;
        }

        this.isloading = false;
        console.log(this.adminStats);
      },
      error: (error) => {
        this.notification.showError("An Error Occurred while processing your request");
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
  }

  setData() {
    console.log(this.authService.user?.role_id)
    if(this.authService.user?.role_id == 1) this.getAdminStats();
    if(this.authService.user?.role_id == 5) this.getArtisanStats();
  }


  // Stock Methods
  loadStockTypes() {
    this.isStockTypesLoading = true;
    this.apiService.get_stock_types().subscribe({
      next: (res) => {
        this.stockTypes = res.map((type: any) => ({ stock_type_id: type.stock_type_id, name: type.type_name, created_at: type.created_at }));
        this.isStockTypesLoading = false;
      },
      error: (err) => { console.error('Error loading stock types:', err); this.isStockTypesLoading = false; }
    });
  }

  getStock(stockTypeId?: number) {
    this.isloadingCard1 = true;
    this.apiService.get_all_stock().subscribe({
      next: res => {
        let stock = res as StockDetails[];
        this.stock = stock.flatMap(x => x.stock_details as unknown as stock);

        if (stockTypeId) this.stock = this.stock.filter(item => item.stock_type?.stock_type_id === stockTypeId);

        const sortedStock = this.stock.sort((a,b) => a.stock_level - b.stock_level).slice(0,10);
        const labels = sortedStock.map(x => x.name);
        const data = sortedStock.map(x => x.stock_level);
        const backgroundColors = sortedStock.map(x => x.stock_level > 10 ? '#17726d' : '#FF0000');

        this.updateStockChart(labels,data,backgroundColors);
        this.isloadingCard1 = false;
      },
      error: () => { this.notification.showError("An Error Occurred while processing your request"); this.isloadingCard1 = false; }
    });
  }

  updateStockChart(labels: string[], data: number[], backgroundColors: string[]) {
    let delayed: any;

    if(this.chart_levels) this.chart_levels.destroy();

    this.chart_levels = new Chart('canvas_levels', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Stock Level', data, backgroundColor: backgroundColors, borderColor: backgroundColors, borderWidth: 1 }] },
      options: {
        responsive: true,
        scales: { x: { title: { display: true, text: 'Stock Items' } }, y: { beginAtZero: true, title: { display: true, text: 'Quantity in Stock' } } },
        plugins: { legend: { display: false }, title: { display: true, text: this.selectedStockTypeId ? `Stock Levels (${this.getStockTypeName()})` : 'Top 10 Stock Levels (All Types)' } },
        animation: { onComplete: () => delayed = true, delay: (context) => context.type==='data' && context.mode==='default' && !delayed ? context.dataIndex*300 : 0 }
      }
    });
  }

  getStockTypeName(): string {
    const type = this.stockTypes.find(t => t.stock_type_id === this.selectedStockTypeId);
    return type ? type.name : 'Selected Type';
  }

  onStockTypeChange(event: Event | number) {
    const typeId = typeof event === 'number' ? event : Number((event.target as HTMLSelectElement).value);
    if(typeId) { this.selectedStockTypeId = typeId; this.getStock(typeId); }
  }

  clearStockTypeFilter() { this.selectedStockTypeId = null; this.getStock(); }


  // Quotation Methods
  loadQuotations(): void {
    this.isloading = true;
    this.currentDate = new Date();
    this.apiService.get_quotations().subscribe({
      next: (response) => {
        this.quotations = ([...response] as quotation[]).sort((a,b) => b.quotation_id - a.quotation_id);
        this.pending = this.quotations.filter(x => x.quotation_status?.quotation_status_id === 1);
        this.isloading = false;
      },
      error: (err) => { console.error('Error loading quotations:', err); this.isloading = false; }
    });
  }

  viewPendingQuotationsReport() {
    this.showPendingQuotationsModal = true;
    this.loadQuotations();
  }


  // Open Modals
  openRevenueReport(): void {
    this.modal.create({
      nzContent: RevenueComponent,
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
  openPendingJobRequestsReport(): void {
    this.modal.create({
      nzContent: PendingJobRequestsComponent,
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

  openMonthlyHoursReport(): void {
    this.modal.create({
      nzTitle: 'Monthly Hours Worked Report',
      nzContent: MonthlyHoursWorkedComponent,
      nzFooter: null,
      nzClosable: true,
      nzMaskClosable: true,
      nzStyle: { top: '5vh', width: '90vw', height: '90vh', maxWidth: '90vw' },
      nzBodyStyle: { height: 'calc(90vh - 55px)', overflow: 'auto', padding: '0' },
      nzWidth: '90vw'
    });
  }

  openLowStockReport(): void {
    this.modal.create({
      nzTitle: 'Low Stock Report',
      nzContent: LowStockComponent,
      nzFooter: null,
      nzClosable: true,
      nzMaskClosable: true,
      nzStyle: { top: '5vh', width: '90vw', height: '90vh', maxWidth: '90vw' },
      nzBodyStyle: { height: 'calc(90vh - 55px)', overflow: 'auto', padding: '0' },
      nzWidth: '90vw'
    });
  }

  openStockReport(): void {
    this.modal.create({ nzContent: StockReportComponent, nzFooter: null, nzClosable: true, nzMaskClosable: true, nzStyle: { top: '5vh', width: '90vw', height: '90vh', maxWidth: '90vw' }, nzBodyStyle: { height: 'calc(90vh - 55px)', overflow: 'auto', padding: '0' }, nzWidth: '90vw' });
  }

  openPendingQuotesReport(): void {
    this.modal.create({ nzContent: PendingQuotesComponent, nzFooter: null, nzClosable: true, nzMaskClosable: true, nzStyle: { top: '5vh', width: '90vw', height: '90vh', maxWidth: '90vw' }, nzBodyStyle: { height: 'calc(90vh - 55px)', overflow: 'auto', padding: '0' }, nzWidth: '90vw' });
  }

  openUnpaidInvoicesReport(): void {
    this.modal.create({ nzContent: UnpaidInvoicesComponent, nzFooter: null, nzClosable: true, nzMaskClosable: true, nzStyle: { top: '5vh', width: '90vw', height: '90vh', maxWidth: '90vw' }, nzBodyStyle: { height: 'calc(90vh - 55px)', overflow: 'auto', padding: '0' }, nzWidth: '90vw' });
  }

  openQuotationsReport(): void {
    this.modal.create({ nzContent: QuotationsReportComponent, nzFooter: null, nzClosable: true, nzMaskClosable: true, nzStyle: { top: '5vh', width: '90vw', height: '90vh', maxWidth: '90vw' }, nzBodyStyle: { height: 'calc(90vh - 55px)', overflow: 'auto', padding: '0' }, nzWidth: '90vw' });
  }

  openJobCardsByStatusReport(): void {
    this.modal.create({ nzContent: JobCardsReportComponent, nzFooter: null, nzClosable: true, nzMaskClosable: true, nzStyle: { top: '5vh', width: '90vw', height: '90vh', maxWidth: '90vw' }, nzBodyStyle: { height: 'calc(90vh - 55px)', overflow: 'auto', padding: '0' }, nzWidth: '90vw' });
  }

  openStockByTypeReport(): void {
    this.modal.create({ nzContent: StockTypeReportComponent, nzFooter: null, nzClosable: true, nzMaskClosable: true, nzStyle: { top: '5vh', width: '90vw', height: '90vh', maxWidth: '90vw' }, nzBodyStyle: { height: 'calc(90vh - 55px)', overflow: 'auto', padding: '0' }, nzWidth: '90vw' });
  }

  // Help Modals
  openAdminHelpModal() { this.showAdminHelpModal = true; }
  openEmployeeHelpModal() { this.showEmployeeHelpModal = true; }
  openCustomerHelpModal() { this.showCustomerHelpModal = true; }
}
