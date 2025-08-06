// quotations-report.component.ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DatePipe } from '@angular/common';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-quotations-report',
  templateUrl: './quotations-report.component.html',
  styleUrls: ['./quotations-report.component.less'],
  standalone: true,
  providers: [DatePipe],
  imports: [AppModule]
})
export class QuotationsReportComponent {
  @ViewChild('reportContent') reportContent!: ElementRef;

  isLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;
  groupedData: any[] = [];
  grandTotal: any = { quoteCount: 0, totalValue: 0 };
  currentDate: Date = new Date();
  generatedBy: string = '';

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {
    this.generatedBy = this.authService.user?.name || '';
    this.loadQuotationsReport();
  }

  loadQuotationsReport(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.currentDate = new Date();

    this.apiService.get_quotations().subscribe({
      next: (response) => {
        try {
          this.processData(response);
        } catch (error) {
          this.errorMessage = 'Error processing quotation data';
          console.error('Processing error:', error);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.errorMessage = 'Failed to load quotation data';
        this.isLoading = false;
      }
    });
  }

processData(quotations: any[]): void {
  this.groupedData = [];
  this.grandTotal = { quoteCount: 0, totalValue: 0 };

  // Group by month
  const monthGroups = new Map<string, {
    monthLabel: string;
    statusGroups: Map<string, { count: number, value: number }>;
    quoteCount: number;
    totalValue: number;
  }>();

  quotations.forEach(quote => {
    // Parse date safely - handle PostgreSQL format
    let monthKey = 'Unknown';
    let monthLabel = 'Unknown Date';

    try {
            console.log('Original date:', quote.created_at);
console.log('Month key:', monthKey, 'Month label:', monthLabel);
      if (quote.created_at) {

        // Parse the PostgreSQL timestamp manually
        const dateParts = quote.created_at.split(' ')[0].split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);

        if (!isNaN(year) && !isNaN(month)) {
          monthKey = `${year}-${month.toString().padStart(2, '0')}`;

          // Create a date object for formatting
          const date = new Date(year, month - 1, 1);
          monthLabel = this.datePipe.transform(date, 'MMMM yyyy') || monthLabel;

        }
      }
    } catch (e) {
      console.warn('Date parsing error', e, 'for value', quote.created_at);

    }

    // Rest of the processing remains the same
    if (!monthGroups.has(monthKey)) {
      monthGroups.set(monthKey, {
        monthLabel: monthLabel,
        statusGroups: new Map<string, { count: number, value: number }>(),
        quoteCount: 0,
        totalValue: 0
      });
    }

    const monthGroup = monthGroups.get(monthKey)!;
    const status = quote.quotation_status?.status || 'Unknown Status';
    const value = quote.total_cost || 0;

    // Update status group
    if (!monthGroup.statusGroups.has(status)) {
      monthGroup.statusGroups.set(status, { count: 0, value: 0 });
    }

    const statusData = monthGroup.statusGroups.get(status)!;
    statusData.count++;
    statusData.value += value;

    // Update month totals
    monthGroup.quoteCount++;
    monthGroup.totalValue += value;

    // Update grand totals
    this.grandTotal.quoteCount++;
    this.grandTotal.totalValue += value;
  });

  // Convert to array structure
  this.groupedData = Array.from(monthGroups.entries()).map(([key, value]) => {
    // Convert status groups to array
    const statusGroups = Array.from(value.statusGroups.entries())
      .map((entry) => {
        const [status, data] = entry;
        return {
          status: status,
          count: data.count,
          value: data.value
        };
      });

    return {
      monthKey: key,
      monthLabel: value.monthLabel,
      quoteCount: value.quoteCount,
      totalValue: value.totalValue,
      statusGroups: statusGroups
    };
  });

  // Sort months chronologically (newest first)
  this.groupedData.sort((a, b) => {
    if (a.monthKey === 'Unknown') return 1;
    if (b.monthKey === 'Unknown') return -1;
    return b.monthKey.localeCompare(a.monthKey);
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

      // Wait for elements to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // PDF generation settings
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const scale = 2;

      // Capture the entire content as one image
      const canvas = await html2canvas(clone, {
        scale: scale,
        useCORS: true,
        logging: false
      });

      document.body.removeChild(tempContainer);

      // Calculate image dimensions
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate aspect ratios
      const imgAspectRatio = imgWidth / imgHeight;
      const pageAspectRatio = pageWidth / pageHeight;

      // Determine how to fit the content on the page
      let renderWidth, renderHeight;

      if (imgAspectRatio > pageAspectRatio) {
        renderWidth = pageWidth;
        renderHeight = pageWidth / imgAspectRatio;
      } else {
        renderHeight = pageHeight;
        renderWidth = pageHeight * imgAspectRatio;
      }

      // Calculate how many pages we need
      const pages = Math.ceil(renderHeight / pageHeight);

      // Add pages with proper pagination
      for (let i = 0; i < pages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to current page
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          margin - (i * pageHeight),
          renderWidth,
          renderHeight
        );
      }

      pdf.save(`quotations-report-${new Date().toISOString().slice(0, 10)}.pdf`);

    } catch (error) {
      console.error('Export error:', error);
      this.notification.showError('Export Failed', 'Could not generate PDF');
    } finally {
      this.isExporting = false;
    }
  }

  formatCurrency(value: number): string {
    return 'R ' + (value || 0).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
