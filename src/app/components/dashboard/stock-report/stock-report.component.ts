// stock-report.component.ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-stock-report',
  templateUrl: './stock-report.component.html',
  styleUrls: ['./stock-report.component.less'],
  imports: [AppModule],
  standalone: true
})
export class StockReportComponent {
  @ViewChild('reportContent') reportContent!: ElementRef;

  isLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;
  groupedData: any[] = [];
  grandTotal: any = { skuCount: 0, totalQuantity: 0, totalValue: 0 };
  currentDate: Date = new Date();
  generatedBy: string = '';

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private authService: AuthService
  ) {
    this.generatedBy = this.authService.user?.name || '';
    this.loadStockReport();
  }

  loadStockReport(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.currentDate = new Date();

    this.apiService.get_all_stock().subscribe({
      next: (response) => {
        try {
          // Process the API response
          const stockItems = response.map((item: any) => ({
            ...item.stock_details,
            stock_id: item.stock_id,
            created_at: item.created_at,
            value: item.stock_details.price * item.stock_details.stock_level
          }));

          this.processData(stockItems);
        } catch (error) {
          this.errorMessage = 'Error processing stock data';
          console.error('Processing error:', error);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.errorMessage = 'Failed to load stock data';
        this.isLoading = false;
      }
    });
  }

  processData(stockItems: any[]): void {
    this.groupedData = [];
    this.grandTotal = { skuCount: 0, totalQuantity: 0, totalValue: 0 };

    // Group by stock type
    const typeGroups = stockItems.reduce((groups, item) => {
      const typeName = item.stock_type?.type_name || 'Uncategorized';
      if (!groups[typeName]) {
        groups[typeName] = {
          typeName: typeName,
          materials: {},
          skuCount: 0,
          totalQuantity: 0,
          totalValue: 0
        };
      }

      // Group by material within type
      const materialName = item.material?.material_name || 'Unspecified';
      if (!groups[typeName].materials[materialName]) {
        groups[typeName].materials[materialName] = {
          materialName: materialName,
          items: [],
          skuCount: 0,
          totalQuantity: 0,
          totalValue: 0
        };
      }

      // Add item to material group
      groups[typeName].materials[materialName].items.push(item);
      groups[typeName].materials[materialName].skuCount++;
      groups[typeName].materials[materialName].totalQuantity += item.stock_level;
      groups[typeName].materials[materialName].totalValue += item.value;

      // Update type group totals
      groups[typeName].skuCount++;
      groups[typeName].totalQuantity += item.stock_level;
      groups[typeName].totalValue += item.value;

      // Update grand totals
      this.grandTotal.skuCount++;
      this.grandTotal.totalQuantity += item.stock_level;
      this.grandTotal.totalValue += item.value;

      return groups;
    }, {});

    // Convert to array structure
    this.groupedData = Object.keys(typeGroups).map(typeName => {
      const typeGroup = typeGroups[typeName];
      return {
        typeName: typeGroup.typeName,
        skuCount: typeGroup.skuCount,
        totalQuantity: typeGroup.totalQuantity,
        totalValue: typeGroup.totalValue,
        materials: Object.keys(typeGroup.materials).map(materialName => typeGroup.materials[materialName])
      };
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

    // Calculate how many pages we need
    const pages = Math.ceil(renderHeight / pageHeight);

    // Add pages with proper pagination
    for (let i = 0; i < pages; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      // Calculate vertical position for this page
      const yPos = -(i * pageHeight);

      // Add image to current page
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin,
        renderWidth,
        renderHeight
      );

    }

    pdf.save(`stock-report-${new Date().toISOString().slice(0, 10)}.pdf`);

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

  getStockLevelColor(stockLevel: number): string {
    if (stockLevel < 10) return '#f5222d';   // Red for critical
    if (stockLevel < 50) return '#faad14';   // Orange for low
    return '#52c41a';                       // Green for normal
  }
}
