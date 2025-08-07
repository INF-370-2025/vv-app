// quotations-report.component.ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import autoTable from 'jspdf-autotable';
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
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = margin;

    // Add logo
    const logoData = await this.getLogoData('assets/images/logo.png');
    if (logoData) {
      const logoWidth = 30; // Fixed width in mm
      const logoHeight = (logoData.height * logoWidth) / logoData.width; // Maintain aspect ratio
      const logoX = (pageWidth - logoWidth) / 2; // Center horizontally

      doc.addImage(
        logoData.dataUrl,
        'PNG',
        logoX,
        yPos,
        logoWidth,
        logoHeight
      );
      yPos += logoHeight + 5; // Add space after logo
    }

    // Add report title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Quotations Summary Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Add subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Breakdown by month and status', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Add metadata
    doc.setFontSize(10);
    doc.text(`Date Generated: ${this.currentDate.toLocaleDateString()}`, margin, yPos);
    doc.text(`Generated By: ${this.generatedBy}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    // Prepare table data
    const headers = ['Month', 'Status', 'Number of Quotes', 'Total Value (R)'];
    const tableData: any[] = [];

    // Flatten the hierarchical data into rows
    for (const month of this.groupedData) {
      for (const statusGroup of month.statusGroups) {
        tableData.push([
          statusGroup === month.statusGroups[0] ? month.monthLabel : '',
          statusGroup.status,
          statusGroup.count.toString(),
          this.formatCurrency(statusGroup.value)
        ]);
      }

      // Month subtotal row - push as normal array
      tableData.push([
        `Subtotal for ${month.monthLabel}`,
        '',
        month.quoteCount.toString(),
        this.formatCurrency(month.totalValue)
      ]);
    }

    // Grand total row - push as normal array
    tableData.push([
      'Grand Total',
      '',
      this.grandTotal.quoteCount.toString(),
      this.formatCurrency(this.grandTotal.totalValue)
    ]);

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [41, 128, 185], // Dark blue
        textColor: 255, // White
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },
        1: { cellWidth: 40, halign: 'left' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' }
      },
      theme: 'grid',
      didParseCell: (data) => {
        // Style subtotal rows
        if (data.row.section === 'body' && data.row.index < tableData.length) {
          const row = tableData[data.row.index];
          if (row[0] && row[0].startsWith('Subtotal for')) {
            data.cell.styles.fillColor = [249, 249, 249]; // Light gray
            data.cell.styles.fontStyle = 'bold';
          }
          // Style grand total row
          else if (row[0] === 'Grand Total') {
            data.cell.styles.fillColor = [230, 247, 255]; // Light blue
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Add footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(9);
    doc.text('Vault Vision', pageWidth / 2, footerY, { align: 'center' });

    // Save PDF
    doc.save(`quotations-report-${new Date().toISOString().slice(0, 10)}.pdf`);

  } catch (error) {
    console.error('Export error:', error);
    this.notification.showError('Export Failed', 'Could not generate PDF');
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

  formatCurrency(value: number): string {
    return 'R ' + (value || 0).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
