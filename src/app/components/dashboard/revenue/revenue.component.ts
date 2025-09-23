import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import { AppModule } from '../../../app.module';

interface RevenueData {
  month: string;
  revenue: number;
  invoice_count: number;
}

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [AppModule],
  templateUrl: './revenue.component.html',
  styleUrls: ['./revenue.component.less']
})
export class RevenueComponent implements AfterViewInit {
  @ViewChild('revenueChart') revenueChart!: ElementRef;
  chart: any;

  isLoading = false;
  isExporting = false;
  revenueData: RevenueData[] = [];
  currentDate: Date = new Date();
  generatedBy = '';
  totalRevenue = 0;
  totalInvoices = 0;
  chartLabels: string[] = [];

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private authService: AuthService
  ) {
    this.generatedBy = this.authService.user?.name || '';
  }

  ngAfterViewInit() {
    this.loadRevenueData();
  }

  loadRevenueData() {
    this.isLoading = true;
    this.apiService.get_revenue_data().subscribe({
      next: (data: RevenueData[]) => {
        this.revenueData = data || [];
        this.processRevenueData();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.notification.showError('Load Error', 'Failed to load revenue data');
        this.isLoading = false;
      }
    });
  }

  private processRevenueData() {
    this.totalRevenue = this.revenueData.reduce((sum, m) => sum + Number(m.revenue || 0), 0);
    this.totalInvoices = this.revenueData.reduce((sum, m) => sum + Number(m.invoice_count || 0), 0);

    // Extract and format month labels
    this.chartLabels = this.revenueData.map(item => {
      const [month, year] = item.month.split(' ');
      return `${month} ${year}`;
    });

    if (this.revenueData.length > 0) {
      this.createChart();
    }
  }

  createChart() {
    if (this.chart) this.chart.destroy();

    const ctx = this.revenueChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.revenueData.map(m => Number(m.revenue || 0));
    const maxRevenue = Math.max(...data);

    // Calculate nice intervals for y-axis
    const getNiceTicks = (maxValue: number) => {
      const roughTicks = 5;
      const roughStep = maxValue / roughTicks;
      const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
      let step = Math.ceil(roughStep / magnitude) * magnitude;

      // Ensure we have reasonable intervals
      const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
      const niceStep = steps.find(s => s >= step) || step;

      const ticks = [];
      let tickValue = 0;
      while (tickValue <= maxValue * 1.1) { // Add 10% padding
        ticks.push(tickValue);
        tickValue += niceStep;
      }
      return ticks;
    };

    const yTicks = getNiceTicks(maxRevenue);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartLabels,
        datasets: [{
          label: 'Revenue (R)',
          data: data,
          backgroundColor: '#17726d',
          borderColor: '#0d5955',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Revenue (R)' },
            ticks: {
              callback: function(value) {
                return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 0 });
              },
              stepSize: yTicks.length > 1 ? yTicks[1] - yTicks[0] : undefined
            },
            suggestedMax: yTicks.length > 0 ? yTicks[yTicks.length - 1] : undefined
          },
          x: {
            title: { display: true, text: 'Month' }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Revenue Trend (Past 6 Months)'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        }
      }
    });
  }

  async exportToPDF() {
    this.isExporting = true;

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 114, 109);
      doc.text('Revenue Report - Past 6 Months', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Metadata
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date Generated: ${this.currentDate.toLocaleDateString()}`, margin, yPos);
      doc.text(`Generated By: ${this.generatedBy}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;

      doc.text(`Total Revenue: R ${this.totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, margin, yPos);
      doc.text(`Total Invoices: ${this.totalInvoices}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 15;

      // Chart area
      const chartHeight = 120;
      const chartArea = { x: margin, y: yPos, width: contentWidth, height: chartHeight };

      // Background + border
      doc.setFillColor(240, 240, 240);
      doc.rect(chartArea.x, chartArea.y, chartArea.width, chartArea.height, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

      // Calculate consistent intervals
      const maxValue = Math.max(...this.revenueData.map(m => m.revenue), 1);
      const getNiceTicks = (maxValue: number) => {
        const roughTicks = 5;
        const roughStep = maxValue / roughTicks;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        let step = Math.ceil(roughStep / magnitude) * magnitude;

        const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
        const niceStep = steps.find(s => s >= step) || step;

        const ticks = [];
        let tickValue = 0;
        while (tickValue <= maxValue * 1.1) {
          ticks.push(tickValue);
          tickValue += niceStep;
        }
        return ticks;
      };

      const yTicks = getNiceTicks(maxValue);
      const yAxisSteps = yTicks.length - 1;

      // Draw bars
      const barSpacing = 5;
      const barCount = this.revenueData.length;
      const barWidth = (contentWidth - (barSpacing * (barCount + 1))) / barCount;

      this.revenueData.forEach((item, index) => {
        const monthName = item.month.substring(0, 3);
        const barHeight = (item.revenue / maxValue) * chartHeight * 0.8;
        const barX = margin + (index * (barWidth + barSpacing)) + barSpacing;
        const barY = chartArea.y + chartHeight - barHeight;

        // Bar
        doc.setFillColor(23, 114, 109);
        doc.rect(barX, barY, barWidth, barHeight, 'F');

        // Border
        doc.setDrawColor(13, 89, 85);
        doc.rect(barX, barY, barWidth, barHeight);

        // Value label
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `R${item.revenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`,
          barX + (barWidth / 2),
          barY - 3,
          { align: 'center' }
        );

        // Month label
        doc.text(
          monthName,
          barX + (barWidth / 2),
          chartArea.y + chartHeight + 5,
          { align: 'center' }
        );
      });

      // Y-axis grid lines + labels using consistent intervals
      yTicks.forEach((value, i) => {
        const y = chartArea.y + chartHeight - (value / maxValue) * chartHeight * 0.8;

        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(`R${value.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`, margin - 2, y, { align: 'right' });

        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin, y, margin + contentWidth, y);
      });

      // Axis titles
      doc.setFontSize(10);
      doc.text('Revenue (R)', margin - 15, chartArea.y + (chartHeight / 2), {
        align: 'right',
        angle: 90
      });
      doc.text('Months', margin + (contentWidth / 2), chartArea.y + chartHeight + 15, {
        align: 'center'
      });

      yPos += chartHeight + 25;

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(9);
      doc.text('Vault Vision', pageWidth / 2, footerY, { align: 'center' });

      // Save PDF
      doc.save(`revenue-report-${new Date().toISOString().slice(0, 10)}.pdf`);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.notification.showError('Export Error', 'Failed to generate PDF');
    } finally {
      this.isExporting = false;
    }
  }

}
