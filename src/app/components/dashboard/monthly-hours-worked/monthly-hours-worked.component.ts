import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  @ViewChild('reportContent') reportContent!: ElementRef;

  selectedYear: number = new Date().getFullYear();
  yearOptions: number[] = this.generateYearOptions();
  isLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;
  chart: any;
  months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  currentDate: Date = new Date();
  generatedBy: string = '';
  totalHours: number = 0;

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
        const content = this.reportContent.nativeElement;
        const clone = content.cloneNode(true);

        // Create temporary container
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.appendChild(clone);
        document.body.appendChild(tempContainer);

        // Remove export button from clone
        const buttonContainer = clone.querySelector('.report-actions');
        if (buttonContainer) {
            buttonContainer.remove();
        }

        // Add logo to the clone
        const logo = document.createElement('img');
        logo.src = 'assets/images/logo.png';
        logo.style.width = '150px';
        logo.style.marginBottom = '20px';
        clone.insertBefore(logo, clone.firstChild);

        // Wait for all content to render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Force the chart to redraw before capturing
        const chartCanvas = clone.querySelector('canvas');
        if (chartCanvas) {
            const chartId = chartCanvas.id;
            const chart = Chart.getChart(chartId);
            if (chart) {
                chart.update(); // Update the chart to ensure it's rendered
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Use html2canvas with improved settings
        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc) => {
                // Make sure all elements are visible
                const elements = clonedDoc.querySelectorAll('*');
                elements.forEach(el => {
                    // Cast to HTMLElement to access style property
                    const htmlEl = el as HTMLElement;
                    const computedStyle = window.getComputedStyle(htmlEl);

                    if (computedStyle.opacity === '0') {
                        htmlEl.style.opacity = '1';
                    }
                    if (computedStyle.visibility === 'hidden') {
                        htmlEl.style.visibility = 'visible';
                    }
                });
            }
        });

        document.body.removeChild(tempContainer);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pageWidth - 2 * margin;

        // Calculate aspect ratio friendly dimensions
        const imgData = canvas.toDataURL('image/png');
        const imgRatio = canvas.width / canvas.height;
        const imgWidth = contentWidth;
        const imgHeight = imgWidth / imgRatio;

        let heightLeft = imgHeight;
        let position = 0;

        // First page
        pdf.addImage(
            imgData,
            'PNG',
            margin,
            margin + position,
            imgWidth,
            imgHeight
        );

        // Adjust height left to account for margins
        heightLeft -= (pageHeight - 2 * margin);

        // Additional pages
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(
                imgData,
                'PNG',
                margin,
                margin + position,
                imgWidth,
                imgHeight
            );
            heightLeft -= (pageHeight - 2 * margin);
        }

        pdf.save(`monthly-hours-report-${this.selectedYear}.pdf`);

    } catch (error) {
        console.error('Error exporting PDF:', error);
        this.notification.showError('Export Error', 'Failed to generate PDF');
    } finally {
        this.isExporting = false;
    }
}
}
