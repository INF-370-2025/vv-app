import { Component, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import jsPDF from 'jspdf';
import { AppModule } from '../../../app.module';
import autoTable from 'jspdf-autotable';



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

// stock-report.component.ts
// async exportToPDF() {
//   this.isExporting = true;

//   try {
//     const doc = new jsPDF('p', 'mm', 'a4');
//     const margin = 15;
//     const pageWidth = doc.internal.pageSize.getWidth();
//     let yPos = margin;

//     // Add report title
//     doc.setFontSize(18);
//     doc.setFont('helvetica', 'bold');
//     doc.setTextColor(23, 114, 109); // #17726d
//     doc.text('Stock Inventory Report', pageWidth / 2, yPos, { align: 'center' });
//     yPos += 8;

//     // Add subtitle
//     doc.setFontSize(12);
//     doc.setFont('helvetica', 'normal');
//     doc.setTextColor(89, 89, 89); // #595959
//     doc.text('Detailed breakdown by type and material', pageWidth / 2, yPos, { align: 'center' });
//     yPos += 15;

//     // Add metadata
//     doc.setFontSize(10);
//     doc.setTextColor(0, 0, 0); // Black
//     doc.text(`Date Generated: ${this.currentDate.toLocaleDateString()}`, margin, yPos);
//     doc.text(`Generated By: ${this.generatedBy}`, pageWidth - margin, yPos, { align: 'right' });
//     yPos += 12;

//     // Prepare table data
//     const headers = ['Stock Type', 'Material', 'Item Name', 'Stock Level', 'Price (R)', 'Value (R)'];
//     const tableData: any[] = [];

//     // Flatten the hierarchical data into rows
//     for (const typeGroup of this.groupedData) {
//       for (const material of typeGroup.materials) {
//         for (const item of material.items) {
//           tableData.push([
//             item === material.items[0] ? typeGroup.typeName : '',
//             item === material.items[0] ? material.materialName : '',
//             item.name,
//             item.stock_level.toString(),
//             item.price.toFixed(2),
//             (item.price * item.stock_level).toFixed(2)
//           ]);
//         }

//         // Material subtotal row
//         tableData.push([
//           { content: '', colSpan: 2 },
//           `Subtotal for ${material.materialName}`,
//           material.totalQuantity.toString(),
//           '',
//           material.totalValue.toFixed(2)
//         ]);
//       }

//       // Type subtotal row
//       tableData.push([
//         { content: `Subtotal for ${typeGroup.typeName}`, colSpan: 2 },
//         `${typeGroup.skuCount} items`,
//         typeGroup.totalQuantity.toString(),
//         '',
//         typeGroup.totalValue.toFixed(2)
//       ]);
//     }

//     // Grand total row
//     tableData.push([
//       { content: 'Grand Total', colSpan: 2 },
//       `${this.grandTotal.skuCount} items`,
//       this.grandTotal.totalQuantity.toString(),
//       '',
//       this.grandTotal.totalValue.toFixed(2)
//     ]);

//     // Generate table with custom styling
//     autoTable(doc, {
//       head: [headers],
//       body: tableData,
//       startY: yPos,
//       margin: { left: margin, right: margin },
//       styles: {
//         font: 'helvetica',
//         fontSize: 10,
//         cellPadding: 6,
//         valign: 'middle',
//         lineColor: [240, 240, 240], // Light grid lines
//         lineWidth: 0.1
//       },
//       headStyles: {
//         fillColor: [240, 245, 255], // #f0f5ff
//         textColor: 0, // Black
//         fontStyle: 'bold',
//         halign: 'left',
//         lineWidth: 0.3,
//         lineColor: [217, 217, 217] // #d9d9d9
//       },
//       bodyStyles: {
//         fillColor: false, // Transparent background
//       },
//       columnStyles: {
//         0: { cellWidth: 25, halign: 'left' },
//         1: { cellWidth: 25, halign: 'left' },
//         2: { cellWidth: 45, halign: 'left' },
//         3: { cellWidth: 20, halign: 'center' },
//         4: { cellWidth: 25, halign: 'right' },
//         5: { cellWidth: 25, halign: 'right' }
//       },
//       didParseCell: (data) => {
//         // Apply custom styling to subtotal rows
//         if (data.row.index >= 0) {
//           const rowData = tableData[data.row.index];

//           // Material subtotal row
//           if (data.column.index === 2 && typeof rowData[2] === 'string' &&
//               rowData[2].includes('Subtotal for')) {
//             data.cell.styles.fillColor = [249, 249, 249]; // #f9f9f9
//             data.cell.styles.lineWidth = 0.3;
//             data.cell.styles.lineColor = [232, 232, 232]; // #e8e8e8
//             if (data.column.index === 2) {
//               data.cell.styles.fontStyle = 'bold';
//             }
//           }
//           // Type subtotal row
//           else if (data.column.index === 0 && typeof rowData[0] === 'object' &&
//                   rowData[0].content.includes('Subtotal for')) {
//             data.cell.styles.fillColor = [230, 247, 255]; // #e6f7ff
//             data.cell.styles.lineWidth = 0.5;
//             data.cell.styles.lineColor = [24, 144, 255]; // #1890ff
//             data.cell.styles.fontStyle = 'bold';
//           }
//           // Grand total row
//           else if (data.column.index === 0 && typeof rowData[0] === 'object' &&
//                   rowData[0].content === 'Grand Total') {
//             data.cell.styles.fillColor = [246, 255, 237]; // #f6ffed
//             data.cell.styles.lineWidth = 0.5;
//             data.cell.styles.lineColor = [82, 196, 26]; // #52c41a
//             data.cell.styles.fontStyle = 'bold';
//             data.cell.styles.fontSize = 11;
//           }
//         }
//       },
//       didDrawCell: (data) => {
//         // Add colored stock level indicators
//         if (data.column.index === 3 && data.cell.raw) {
//           try {
//             const stockLevel = typeof data.cell.raw === 'number'
//               ? data.cell.raw
//               : parseInt(data.cell.raw.toString());

//             if (!isNaN(stockLevel)) {
//               // Calculate tag position and size
//               const tagWidth = 30;
//               const tagHeight = 20;
//               const x = data.cell.x + (data.cell.width - tagWidth) / 2;
//               const y = data.cell.y + (data.cell.height - tagHeight) / 2;

//               // Set tag color based on stock level
//               let r = 0, g = 0, b = 0;
//               if (stockLevel < 10) {
//                 r = 245; g = 34; b = 45;    // Red
//               } else if (stockLevel < 50) {
//                 r = 250; g = 173; b = 20;   // Orange
//               } else {
//                 r = 82; g = 196; b = 26;    // Green
//               }

//               // Draw tag background
//               doc.setFillColor(r, g, b);
//               doc.roundedRect(x, y, tagWidth, tagHeight, 2, 2, 'F');

//               // Draw stock level text
//               doc.setFontSize(10);
//               doc.setTextColor(0, 0, 0);
//               doc.text(
//                 stockLevel.toString(),
//                 x + tagWidth / 2,
//                 y + tagHeight / 2 + 1,
//                 { align: 'center', baseline: 'middle' }
//               );

//               return true; // Skip default rendering
//             }
//           } catch (e) {
//             console.warn('Error drawing stock level cell', e);
//           }
//         }
//         return false;
//       }
//     });

//     // Add footer
//     const footerY = doc.internal.pageSize.getHeight() - 15;
//     doc.setFontSize(10);
//     doc.setTextColor(140, 140, 140); // #8c8c8c
//     doc.text('Vault Vision', pageWidth / 2, footerY, { align: 'center' });

//     // Save PDF
//     doc.save(`stock-report-${new Date().toISOString().slice(0, 10)}.pdf`);

//   } catch (error) {
//     console.error('Export error:', error);
//     this.notification.showError('Export Failed', 'Could not generate PDF');
//   } finally {
//     this.isExporting = false;
//   }
// }

  formatCurrency(value: number): string {
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }

  getStockLevelColor(stockLevel: number): string {
    if (stockLevel < 10) return '#f5222d';   // Red for critical
    if (stockLevel < 50) return '#faad14';   // Orange for low
    return '#52c41a';                       // Green for normal
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
    doc.text('Stock Inventory Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Add subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Detailed breakdown by type and material', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Add metadata
    doc.setFontSize(10);
    doc.text(`Date Generated: ${this.currentDate.toLocaleDateString()}`, margin, yPos);
    doc.text(`Generated By: ${this.generatedBy}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    // Prepare table data
    const headers = ['Stock Type', 'Material', 'Item Name', 'Stock Level', 'Price (R)', 'Value (R)'];
    const tableData: any[] = [];

    // Helper function to check if value is string
    const isString = (value: any): value is string => typeof value === 'string';

    // Flatten the hierarchical data into rows
    for (const typeGroup of this.groupedData) {
      for (const material of typeGroup.materials) {
        for (const item of material.items) {
          tableData.push([
            item === material.items[0] ? typeGroup.typeName : '',
            item === material.items[0] ? material.materialName : '',
            item.name,
            item.stock_level.toString(),
            item.price.toFixed(2),
            (item.price * item.stock_level).toFixed(2)
          ]);
        }

        // Material subtotal row
        tableData.push([
          { content: '', colSpan: 2 },
          `Subtotal for ${material.materialName}`,
          material.totalQuantity.toString(),
          '',
          material.totalValue.toFixed(2)
        ]);
      }

      // Type subtotal row
      tableData.push([
        { content: `Subtotal for ${typeGroup.typeName}`, colSpan: 2 },
        `${typeGroup.skuCount} items`,
        typeGroup.totalQuantity.toString(),
        '',
        typeGroup.totalValue.toFixed(2)
      ]);
    }

    // Grand total row
    tableData.push([
      { content: 'Grand Total', colSpan: 2 },
      `${this.grandTotal.skuCount} items`,
      this.grandTotal.totalQuantity.toString(),
      '',
      this.grandTotal.totalValue.toFixed(2)
    ]);

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fillColor: false, // Remove default background
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 45 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      },
      theme: 'grid',
      didParseCell: (data) => {
        // Style subtotal rows
        if (data.row.index >= 0) {
          const rowData = tableData[data.row.index];

          if (Array.isArray(rowData)) {
            // Check for material subtotal (3rd cell contains text)
            if (data.column.index === 2 && isString(rowData[2]) && rowData[2].includes('Subtotal for')) {
              data.cell.styles.fillColor = [241, 241, 241];
              data.cell.styles.fontStyle = 'bold';
            }
            // Check for type subtotal (1st cell is object with content)
            else if (data.column.index === 0 &&
                     typeof rowData[0] === 'object' &&
                     isString(rowData[0].content) &&
                     rowData[0].content.includes('Subtotal for')) {
              data.cell.styles.fillColor = [230, 247, 255];
              data.cell.styles.fontStyle = 'bold';
            }
            // Check for grand total
            else if (data.column.index === 0 &&
                     typeof rowData[0] === 'object' &&
                     isString(rowData[0].content) &&
                     rowData[0].content === 'Grand Total') {
              data.cell.styles.fillColor = [237, 247, 237];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
      didDrawCell: (data) => {
        // Add background colors for stock level tags
        if (data.column.index === 3 && data.cell.raw) {
          try {
            // Convert to number safely
            const stockLevel = typeof data.cell.raw === 'number'
              ? data.cell.raw
              : parseInt(data.cell.raw.toString());

            if (!isNaN(stockLevel)) {
              let r = 0, g = 0, b = 0;

              if (stockLevel < 10) {
                r = 245; g = 34; b = 45;    // Red
              } else if (stockLevel < 50) {
                r = 250; g = 173; b = 20;   // Orange
              } else {
                r = 82; g = 196; b = 26;    // Green
              }

              doc.setFillColor(r, g, b);
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
              doc.setTextColor(0, 0, 0); // Black text
              doc.text(
                stockLevel.toString(),
                data.cell.x + data.cell.width / 2,
                data.cell.y + data.cell.height / 2 + 2,
                { align: 'center', baseline: 'middle' }
              );
              return true; // Skip default rendering
            }
          } catch (e) {
            console.warn('Error drawing stock level cell', e);
          }
        }
        return false;
      }
    });

    // Add footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(9);
    doc.text('Vault Vision', pageWidth / 2, footerY, { align: 'center' });

    // Save PDF
    doc.save(`stock-report-${new Date().toISOString().slice(0, 10)}.pdf`);

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
}
