import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import { AppModule } from '../../../app.module';

interface StockType {
  stock_type_id: number;
  name: string;
  created_at: string;
}

interface StockItem {
  stock_id: number;
  name: string;
  stock_level: number;
  stock_type?: StockType;
}

@Component({
  selector: 'app-stock-type-report',
  standalone: true,
  imports: [AppModule],
  templateUrl: './stock-type-report.component.html',
  styleUrls: ['./stock-type-report.component.less']
})
export class StockTypeReportComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  chart: any;

  stockTypes: StockType[] = [];
  selectedStockTypeId: number | null = null;
  stock: StockItem[] = [];
  isloadingCard1: boolean = false;
  isStockTypesLoading: boolean = false;
  isExporting: boolean = false;
  errorMessage: string | null = null;
  currentDate: Date = new Date();
  generatedBy: string = '';
  totalItems: number = 0;
  chartData: any[] = [];

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private authService: AuthService
  ) {
    this.generatedBy = this.authService.user?.name || '';
  }

  ngAfterViewInit() {
    this.loadStockTypes();
  }

  loadStockTypes() {
    this.isStockTypesLoading = true;
    this.apiService.get_stock_types().subscribe({
      next: (res) => {
        this.stockTypes = res.map((type: any) => ({
          stock_type_id: type.stock_type_id,
          name: type.type_name,
          created_at: type.created_at
        }));
        this.isStockTypesLoading = false;
        this.getStock();
      },
      error: (err) => {
        console.error('Error loading stock types:', err);
        this.errorMessage = 'Failed to load stock types';
        this.isStockTypesLoading = false;
      }
    });
  }

  getStock(stockTypeId?: number) {
    this.isloadingCard1 = true;
    this.apiService.get_all_stock().subscribe({
      next: res => {
        let stock = res as any[];
        this.stock = stock.flatMap(x => x.stock_details);

        // Apply filter if selected
        if (stockTypeId) {
          this.stock = this.stock.filter(item =>
            item.stock_type?.stock_type_id === stockTypeId
          );
        }

        // Sort and prepare chart data
        const sortedStock = this.stock
          .sort((a, b) => a.stock_level - b.stock_level)
          .slice(0, 10);

        this.chartData = sortedStock;
        this.totalItems = sortedStock.length;

        const labels = sortedStock.map(x => x.name);
        const data = sortedStock.map(x => x.stock_level);
        const backgroundColors = sortedStock.map(x =>
          x.stock_level > 10 ? '#17726d' : '#FF0000'
        );

        this.updateStockChart(labels, data, backgroundColors);
        this.isloadingCard1 = false;
      },
      error: (error) => {
        this.notification.showError("Failed to load stock data");
        this.isloadingCard1 = false;
      }
    });
  }

  updateStockChart(labels: string[], data: number[], backgroundColors: string[]) {
    let delayed: any;

    if (this.chart) {
      this.chart.destroy();
    }

    if (!labels || labels.length === 0) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');

    this.chart = new Chart(ctx, {
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
        scales: {
          x: {
            title: {
              display: true,
              text: 'Stock Items',
              font: { size: 14, weight: 'bold' }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantity in Stock',
              font: { size: 14, weight: 'bold' }
            },
            ticks: { precision: 0 }
          }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: this.selectedStockTypeId
              ? `Stock Levels (${this.getStockTypeName()})`
              : 'Top 10 Stock Levels (All Types)',
            font: { size: 18, weight: 'bold' },
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} units`
            }
          }
        },
        animation: {
          onComplete: () => delayed = true,
          delay: (context) => {
            return context.type === 'data' && context.mode === 'default' && !delayed
              ? context.dataIndex * 300
              : 0;
          },
        }
      }
    });
  }

  getStockTypeName(): string {
    if (!this.selectedStockTypeId) return 'All Types';
    const type = this.stockTypes.find(t => t.stock_type_id === this.selectedStockTypeId);
    return type ? type.name : 'Selected Type';
  }

  onStockTypeChange(event: Event | number) {
    const typeId = typeof event === 'number' ? event : Number((event.target as HTMLSelectElement).value);
    this.selectedStockTypeId = typeId || null;
    this.getStock(typeId);
  }

  clearStockTypeFilter() {
    this.selectedStockTypeId = null;
    this.getStock();
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
      doc.text('Stock Levels Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date Generated: ${this.currentDate.toLocaleDateString()}`, margin, yPos);
      doc.text(`Generated By: ${this.generatedBy}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;

      doc.text(`Stock Type: ${this.getStockTypeName()}`, margin, yPos);
      doc.text(`Items Shown: ${this.totalItems}`, pageWidth - margin, yPos, { align: 'right' });
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
      doc.setDrawColor(200, 200, 200);
      doc.rect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

      // Calculate bar dimensions
      const barSpacing = 5;
      const barCount = this.chartData.length;
      const barWidth = (contentWidth - (barSpacing * (barCount + 1))) / barCount;
      const maxValue = Math.max(...this.chartData.map(item => item.stock_level), 1);

      // Draw bars
      this.chartData.forEach((item, index) => {
        const barHeight = (item.stock_level / maxValue) * chartHeight * 0.8;
        const barX = margin + (index * (barWidth + barSpacing)) + barSpacing;
        const barY = chartArea.y + chartHeight - barHeight;
        const barColor = item.stock_level > 10 ? [23, 114, 109] : [255, 0, 0]; // #17726d or red

        // Draw bar
        doc.setFillColor(barColor[0], barColor[1], barColor[2]);
        doc.rect(barX, barY, barWidth, barHeight, 'F');

        // Draw border
        doc.setDrawColor(barColor[0], barColor[1], barColor[2]);
        doc.rect(barX, barY, barWidth, barHeight);

        // Add value label
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(
          item.stock_level.toString(),
          barX + (barWidth / 2),
          barY - 5,
          { align: 'center' }
        );

        // Truncate long names
        const itemName = item.name.length > 15
          ? item.name.substring(0, 12) + '...'
          : item.name;

        // Add item label
        doc.text(
          itemName,
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
        'Quantity',
        margin - 15,
        chartArea.y + (chartHeight / 2),
        { align: 'right', angle: 90 }
      );

      yPos += chartHeight + 25;

      // Add footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(9);
      doc.text('Vault Vision - Inventory Management System', pageWidth / 2, footerY, { align: 'center' });

      // Save PDF
      doc.save(`stock-levels-report-${new Date().toISOString().slice(0, 10)}.pdf`);

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
