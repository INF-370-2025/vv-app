import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-monthly-hours-worked',
  standalone: true,
  imports: [AppModule],
  templateUrl: './monthly-hours-worked.component.html',
  styleUrls: ['./monthly-hours-worked.component.less']
})
export class MonthlyHoursWorkedComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  chart: any;

  selectedYear: number = new Date().getFullYear();
  yearOptions: number[] = this.generateYearOptions();
  isLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;
  months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  currentDate: Date = new Date();
  generatedBy: string = '';
  totalHours: number = 0;
  monthlyData: any[] = [];
  chartImage: string | null = null;

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private authService: AuthService
  ) {
    this.generatedBy = this.authService.user?.name || '';
  }

  ngAfterViewInit() {
    this.generateReport();
  }

  generateYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }

  generateReport() {
    this.isLoading = true;
    this.errorMessage = null;
    this.currentDate = new Date();
    this.totalHours = 0;

    this.apiService.get_monthly_hours_worked(this.selectedYear).subscribe({
      next: (data: any) => {
        if (data.error) {
          this.errorMessage = data.error;
        } else {
          this.monthlyData = data;
          this.createChart(data);

          // Calculate total hours
          data.forEach((month: any) => {
            this.totalHours += month.total_hours;
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load report data. Please try again.';
        console.error('API Error:', error);
        this.isLoading = false;
      }
    });
  }

  createChart(data: any[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!data || data.length === 0) {
      return;
    }

    const monthlyHours = Array(12).fill(0);

    data.forEach(monthData => {
      const index = monthData.month_number - 1;
      if (index >= 0 && index < 12) {
        monthlyHours[index] = monthData.total_hours;
      }
    });

    const ctx = this.chartCanvas.nativeElement.getContext('2d');

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.months,
        datasets: [{
          label: `Total Hours Worked (${this.selectedYear})`,
          data: monthlyHours,
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
            title: {
              display: true,
              text: 'Hours Worked',
              font: { size: 14, weight: 'bold' }
            },
            ticks: { precision: 0 }
          },
          x: {
            title: {
              display: true,
              text: 'Months',
              font: { size: 14, weight: 'bold' }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14
              }
            }
          },
          title: {
            display: true,
            text: 'Monthly Hours Worked Report',
            font: { size: 18, weight: 'bold' },
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} hours`
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

    // Add logo
    const logoData = await this.getLogoData('assets/images/logo.png');
    if (logoData) {
      const logoWidth = 30;
      const logoHeight = (logoData.height * logoWidth) / logoData.width;
      const logoX = (pageWidth - logoWidth) / 2;

      doc.addImage(
        logoData.dataUrl,
        'PNG',
        logoX,
        yPos,
        logoWidth,
        logoHeight
      );
      yPos += logoHeight + 5;
    }

    // Add report title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 114, 109); // #17726d
    doc.text(`Monthly Hours Worked Report - ${this.selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Add metadata
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(`Date Generated: ${this.currentDate.toLocaleDateString()}`, margin, yPos);
    doc.text(`Generated By: ${this.generatedBy}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;

    doc.text(`Total Hours: ${this.totalHours.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`, margin, yPos);
    doc.text(`Reporting Year: ${this.selectedYear}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    // Create chart area
    const chartHeight = 120;
    const chartArea = {
      x: margin,
      y: yPos,
      width: contentWidth,
      height: chartHeight
    };

    // Draw chart background
    doc.setFillColor(240, 240, 240); // Light gray background
    doc.rect(chartArea.x, chartArea.y, chartArea.width, chartArea.height, 'F');

    // Draw chart border
    doc.setDrawColor(200, 200, 200);
    doc.rect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    // Calculate bar dimensions
    const barSpacing = 5;
    const barCount = this.monthlyData.length;
    const barWidth = (contentWidth - (barSpacing * (barCount + 1))) / barCount;

    // Find max value for scaling
    const maxValue = Math.max(...this.monthlyData.map(m => m.total_hours), 1);

    // Draw bars
    this.monthlyData.forEach((monthData, index) => {
      const monthName = this.months[monthData.month_number - 1].substring(0, 3);
      const barHeight = (monthData.total_hours / maxValue) * chartHeight * 0.8;
      const barX = margin + (index * (barWidth + barSpacing)) + barSpacing;
      const barY = chartArea.y + chartHeight - barHeight;

      // Draw bar
      doc.setFillColor(23, 114, 109); // #17726d
      doc.rect(barX, barY, barWidth, barHeight, 'F');

      // Draw bar border
      doc.setDrawColor(13, 89, 85); // #0d5955
      doc.rect(barX, barY, barWidth, barHeight);

      // Add value label
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(
        monthData.total_hours.toString(),
        barX + (barWidth / 2),
        barY - 5,
        { align: 'center' }
      );

      // Add month label
      doc.text(
        monthName,
        barX + (barWidth / 2),
        chartArea.y + chartHeight + 5,
        { align: 'center' }
      );
    });

    // Draw Y-axis labels
    const yAxisSteps = 5;
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = Math.round((i / yAxisSteps) * maxValue);
      const y = chartArea.y + chartHeight - (i / yAxisSteps) * chartHeight * 0.8;

      doc.setFontSize(8);
      doc.text(
        value.toString(),
        margin - 5,
        y,
        { align: 'right' }
      );

      // Draw grid line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(margin, y, margin + contentWidth, y);
    }

    // Draw Y-axis title
    doc.setFontSize(10);
    doc.text(
      'Hours Worked',
      margin - 15,
      chartArea.y + (chartHeight / 2),
      { align: 'right', angle: 90 }
    );

    // Draw X-axis title
    doc.text(
      'Months',
      margin + (contentWidth / 2),
      chartArea.y + chartHeight + 15,
      { align: 'center' }
    );

    yPos += chartHeight + 25;

    // Add footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(9);
    doc.text('Vault Vision - Workforce Management System', pageWidth / 2, footerY, { align: 'center' });

    // Save PDF
    doc.save(`monthly-hours-report-${this.selectedYear}.pdf`);

  } catch (error) {
    console.error('Error exporting PDF:', error);
    this.notification.showError('Export Error', 'Failed to generate PDF');
  } finally {
    this.isExporting = false;
  }
}

  private getLogoData(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height
        });
      };

      img.onerror = () => {
        console.warn('Could not load logo');
        resolve(null);
      };
    });
  }
}
