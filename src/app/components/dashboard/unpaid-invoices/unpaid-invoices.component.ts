import { Component, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AppModule } from '../../../app.module';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-unpaid-invoices',
  standalone: true,
  imports: [AppModule],
  templateUrl: './unpaid-invoices.component.html',
  styleUrl: './unpaid-invoices.component.less'
})

export class UnpaidInvoicesComponent {
  @ViewChild('reportContent') reportContent!: ElementRef;

  isLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;
  unpaidInvoices: any[] = [];
  currentDate: Date = new Date();
  generatedBy: string = '';
  totalAmount: number = 0;

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private authService: AuthService
  ) {
    this.generatedBy = this.authService.user?.name || '';
    this.loadUnpaidInvoices();
  }

  loadUnpaidInvoices(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.currentDate = new Date();
    this.totalAmount = 0;

    this.apiService.get_unpaid_invoices().subscribe({
      next: (response) => {
        this.unpaidInvoices = response;

        // Calculate total amount
        this.unpaidInvoices.forEach(invoice => {
          this.totalAmount += invoice.total;
        });

        if (this.unpaidInvoices.length === 0) {
          this.errorMessage = 'No unpaid invoices found';
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading unpaid invoices:', err);
        this.errorMessage = 'Failed to load unpaid invoices data';
        this.isLoading = false;
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

        // Wait for elements to render
        await new Promise(resolve => setTimeout(resolve, 500));

        // PDF generation settings
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const scale = 2; // Higher scale for better quality
        const contentWidth = pageWidth - 2 * margin;

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
            // Image is wider than page
            renderWidth = pageWidth;
            renderHeight = pageWidth / imgAspectRatio;
        } else {
            // Image is taller than page
            renderHeight = pageHeight;
            renderWidth = pageHeight * imgAspectRatio;
        }

        // Add image to PDF
        pdf.addImage(
            imgData,
            'PNG',
            margin,  // X position
            margin,  // Y position
            renderWidth,
            renderHeight
        );

        pdf.save(`unpaid-invoices-report-${new Date().toISOString().slice(0, 10)}.pdf`);

    } catch (error) {
        console.error('Export error:', error);
        this.notification.showError('Export Failed', 'Could not generate PDF');
    } finally {
        this.isExporting = false;
    }
}

  formatCurrency(value: number): string {
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }
}
