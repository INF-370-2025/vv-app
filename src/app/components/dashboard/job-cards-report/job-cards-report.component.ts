import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-job-cards-report',
  standalone: true,
  imports: [AppModule],
  templateUrl: './job-cards-report.component.html',
  styleUrls: ['./job-cards-report.component.less']
})
export class JobCardsReportComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  chart: any;

  isLoading: boolean = false;
  isExporting: boolean = false;
  jobCards: any[] = [];
  currentDate: Date = new Date();
  generatedBy: string = '';
  totalJobCards: number = 0;

  statusLabels = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
  statusColors: { [key: string]: string } = {
    'Pending': '#FFA500',
    'In Progress': '#87CEFA',
    'Completed': '#008000',
    'Cancelled': '#FF0000'
  };

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private authService: AuthService
  ) {
    this.generatedBy = this.authService.user?.name || '';
  }

  ngAfterViewInit() {
    this.getJobs();
  }

  getJobs() {
    this.isLoading = true;
    this.apiService.get_job_cards().subscribe({
      next: res => {
        this.jobCards = res as any[];
        this.totalJobCards = this.jobCards.length;
        this.createChart();
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.showError("An Error Occurred while loading job cards");
        this.isLoading = false;
      }
    });
  }

  createChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const statusCountMap: { [key: string]: number } = {
      'Pending': 0,
      'In Progress': 0,
      'Completed': 0,
      'Cancelled': 0
    };

    this.jobCards.forEach(card => {
      const status = card.job_card_status?.status || 'Pending';
      if (status in statusCountMap) {
        statusCountMap[status]++;
      }
    });

    const data = this.statusLabels.map(label => statusCountMap[label]);
    const backgroundColors = this.statusLabels.map(label => this.statusColors[label]);

    const ctx = this.chartCanvas.nativeElement.getContext('2d');

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.statusLabels,
        datasets: [{
          label: 'Job Count',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => this.darkenColor(color, 20)),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            text: 'Job Cards by Status',
            font: { size: 18, weight: 'bold' },
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} jobs`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Jobs',
              font: { size: 14, weight: 'bold' }
            },
            ticks: { precision: 0 }
          },
          x: {
            title: {
              display: true,
              text: 'Status',
              font: { size: 14, weight: 'bold' }
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
      doc.text('Job Cards Status Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date Generated: ${this.currentDate.toLocaleDateString()}`, margin, yPos);
      doc.text(`Generated By: ${this.generatedBy}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;
      doc.text(`Total Job Cards: ${this.totalJobCards}`, margin, yPos);
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
      doc.setFillColor(240, 240, 240);
      doc.rect(chartArea.x, chartArea.y, chartArea.width, chartArea.height, 'F');

      // Draw chart border
      doc.setDrawColor(200, 200, 200);
      doc.rect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

      // Calculate bar dimensions
      const barSpacing = 5;
      const barCount = this.statusLabels.length;
      const barWidth = (contentWidth - (barSpacing * (barCount + 1))) / barCount;

      // Get status counts
      const statusCounts = this.statusLabels.map(label => {
        return this.jobCards.filter(card =>
          card.job_card_status?.status === label
        ).length;
      });

      // Find max value for scaling
      const maxValue = Math.max(...statusCounts, 1);

      // Draw bars
      this.statusLabels.forEach((label, index) => {
        const count = statusCounts[index];
        const barHeight = (count / maxValue) * chartHeight * 0.8;
        const barX = margin + (index * (barWidth + barSpacing)) + barSpacing;
        const barY = chartArea.y + chartHeight - barHeight;

        // Draw bar
        const rgb = this.hexToRgb(this.statusColors[label]);
        if (rgb) {
          doc.setFillColor(rgb.r, rgb.g, rgb.b);
          doc.rect(barX, barY, barWidth, barHeight, 'F');
        }

        // Draw bar border
        doc.setDrawColor(0, 0, 0);
        doc.rect(barX, barY, barWidth, barHeight);

        // Add value label
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(
          count.toString(),
          barX + (barWidth / 2),
          barY - 5,
          { align: 'center' }
        );

        // Add status label
        doc.text(
          label,
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
        'Number of Jobs',
        margin - 15,
        chartArea.y + (chartHeight / 2),
        { align: 'right', angle: 90 }
      );

      // Draw X-axis title
      doc.text(
        'Status',
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
      doc.save(`job-cards-status-report-${this.currentDate.toISOString().slice(0, 10)}.pdf`);

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

  private darkenColor(hex: string, percent: number): string {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.max(0, r - Math.floor(r * percent / 100));
    g = Math.max(0, g - Math.floor(g * percent / 100));
    b = Math.max(0, b - Math.floor(b * percent / 100));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}
