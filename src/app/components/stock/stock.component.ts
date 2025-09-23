import { StockDetails } from './../../models/stock';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { stock } from '../../models/stock';
import { NotificationService } from '../../services/notification.service';
import { StockViewComponent } from './stock-view/stock-view.component';
import { CreateStockComponent } from './create-stock/create-stock.component';
import { UpdateStockComponent } from './update-stock/update-stock.component';
import { material } from '../../models/stock';
import { stock_type, stock_category } from '../../models/stock';
import { saveAs } from 'file-saver';
import { NzTreeModule } from 'ng-zorro-antd/tree';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [AppModule, StockViewComponent, CreateStockComponent, UpdateStockComponent, NzTreeModule],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.less']
})
export class StockComponent implements OnInit {
  allStock: stock[] = [];
  lowStock: stock[] = [];
  mediumStock: stock[] = [];
  highStock: stock[] = [];
  isLoading: boolean = false;
  showStockView: boolean = false;
  showCreateView: boolean = false;
  showUpdateView: boolean = false;
  viewStockItem?: stock;
  stockToUpdate?: stock;
  materials: material [] = [];
  stockTypes: stock_type [] = [];
  stockCategories:  stock_category [] = [];
  importResult: any = null;
  importing = false;
  showHelp: boolean = false;
  showStructureView: boolean = false;
  stockStructure: any[] = [];
  isLoadingStructure: boolean = false;
  showCategoryModal: boolean = false;
  showTypeModal: boolean = false;
  editingCategory: any = null;
  editingType: any = null;
  newCategoryName: string = '';
  newTypeName: string = '';
  selectedCategoryId: number | null = null;
  preselectedTypeId: number | null = null;
  movingType: any = null;
  movingStock: any = null;
  showMoveConfirm: boolean = false;
  moveTarget: any = null;
  moveAction: 'type' | 'stock' | null = null;
  isMoving: boolean = false;



  constructor(
    private apiService: ApiService,
    private notification: NotificationService
    ) {}

  ngOnInit(): void {
    this.loadStock();
  }


  openHelpModal(): void {
  this.showHelp = true;
}

  closeHelpModal(): void {
    this.showHelp = false;
  }

  loadStockStructure(): void {
    this.isLoadingStructure = true;
    this.apiService.get_stock_structure().subscribe({
      next: (response) => {
        this.stockStructure = this.transformToTreeData(response);
        this.isLoadingStructure = false;
      },
      error: (err) => {
        console.error('Error loading stock structure:', err);
        this.isLoadingStructure = false;
        this.notification.showError('Failed to load stock structure', 'Error');
      }
    });
  }

  private transformToTreeData(data: any[]): any[] {
    const categoriesMap = new Map();

    //  category
    data.forEach(item => {
      if (!categoriesMap.has(item.stock_category_id)) {
        categoriesMap.set(item.stock_category_id, {
          key: `category-${item.stock_category_id}`,
          title: item.category_name,
          category: item,
          children: [],
          isLeaf: false,
          expanded: false
        });
      }

      const category = categoriesMap.get(item.stock_category_id);

      let typeNode = category.children.find((t: any) => t.key === `type-${item.stock_type_id}`);

      if (item.stock_type_id && !typeNode) {
        typeNode = {
          key: `type-${item.stock_type_id}`,
          title: item.type_name,
          type: item,
          children: [],
          isLeaf: false,
          expanded: false
        };
        category.children.push(typeNode);
      }

      if (item.stock_id && item.stock_type_id && typeNode) {
        typeNode.children.push({
          key: `stock-${item.stock_id}`,
          title: item.stock_name,
          stock: item,
          isLeaf: true
        });
      }
    });

    return Array.from(categoriesMap.values());
  }

  expandAll(): void {
    this.stockStructure.forEach((category: any) => {
      category.expanded = true;
      category.children.forEach((type: any) => {
        type.expanded = true;
      });
    });
  }

  collapseAll(): void {
    this.stockStructure.forEach((category: any) => {
      category.expanded = false;
      category.children.forEach((type: any) => {
        type.expanded = false;
      });
    });
  }

  toggleAll(expand: boolean): void {
    this.stockStructure.forEach((category: any) => {
      category.expanded = expand;
      category.children.forEach((type: any) => {
        type.expanded = expand;
      });
    });
  }

  loadStock(): void {
    this.isLoading = true;
    this.apiService.get_all_stock().subscribe({
      next: (response) => {
        this.allStock = response.map((item: any) => ({
          ...item.stock_details,
          stock_id: item.stock_id,
          created_at: item.created_at
        })) as stock[];

        // Categorise stock
        this.lowStock = this.allStock.filter(item => item.stock_level < 50);
        this.mediumStock = this.allStock.filter(item => item.stock_level >= 50 && item.stock_level < 250);
        this.highStock = this.allStock.filter(item => item.stock_level >= 250);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading stock:', err);
        this.isLoading = false;
      }
    });
  }

  showStructure(): void {
    this.showStructureView = true;
    this.showStockView = false;
    this.showCreateView = false;
    this.showUpdateView = false;

    this.loadStockStructure();
    this.loadStockTypes();
    this.loadStockCategories();
    this.loadMaterials();
  }

  searchLowStock(event: any) {
    const value = event.target.value.toLowerCase();
    if (value === '') {
      this.lowStock = this.allStock.filter(item => item.stock_level < 50);
    } else {
      this.lowStock = this.lowStock.filter(item =>
        (item.stock_id && item.stock_id.toString() === value) ||
        (item.name && item.name.toLowerCase().includes(value)) ||
        (item.description && item.description.toLowerCase().includes(value)) ||
        (item.material?.material_name && item.material.material_name.toLowerCase().includes(value)) ||
        (item.stock_type?.type_name && item.stock_type.type_name.toLowerCase().includes(value)) ||
        (item.stock_category?.category_name && item.stock_category.category_name.toLowerCase().includes(value))
      );
    }
  }

  searchMediumStock(event: any) {
    const value = event.target.value.toLowerCase();
    if (value === '') {
      this.mediumStock = this.allStock.filter(item => item.stock_level >= 50 && item.stock_level < 250);
    } else {
      this.mediumStock = this.mediumStock.filter(item =>
        (item.stock_id && item.stock_id.toString() === value) ||
        (item.name && item.name.toLowerCase().includes(value)) ||
        (item.description && item.description.toLowerCase().includes(value)) ||
        (item.material?.material_name && item.material.material_name.toLowerCase().includes(value)) ||
        (item.stock_type?.type_name && item.stock_type.type_name.toLowerCase().includes(value))||
        (item.stock_category?.category_name && item.stock_category.category_name.toLowerCase().includes(value))
      );
    }
  }

  searchHighStock(event: any) {
    const value = event.target.value.toLowerCase();
    if (value === '') {
      this.highStock = this.allStock.filter(item => item.stock_level >= 250);
    } else {
      this.highStock = this.highStock.filter(item =>
        (item.stock_id && item.stock_id.toString() === value) ||
        (item.name && item.name.toLowerCase().includes(value)) ||
        (item.description && item.description.toLowerCase().includes(value)) ||
        (item.material?.material_name && item.material.material_name.toLowerCase().includes(value)) ||
        (item.stock_type?.type_name && item.stock_type.type_name.toLowerCase().includes(value)) ||
        (item.stock_category?.category_name && item.stock_category.category_name.toLowerCase().includes(value))
      );
    }
  }

  viewStock(item: stock) {
    this.viewStockItem = item;
    this.showStockView = true;
    this.showCreateView = false;
    this.showUpdateView = false;
  }

  openCreateView(): void {
    this.showCreateView = true;
    this.showStockView = false;
    this.showUpdateView = false;
  }

  handleStockUpdate(updatedStock: any): void {
    // Update the local stock array
    const index = this.allStock.findIndex(s => s.stock_id === updatedStock.stock_id);
    if (index !== -1) {
      // Update both root properties and nested details
      this.allStock[index] = {
        ...this.allStock[index],
        ...updatedStock,
        material: this.allStock[index].material,
        stock_type: this.allStock[index].stock_type
      };
    }

    // Re-categorize stock
    this.categorizeStock();
    this.showUpdateView = false;
  }

  private categorizeStock(): void {
    this.lowStock = this.allStock.filter(item => item.stock_level < 50);
    this.mediumStock = this.allStock.filter(item =>
      item.stock_level >= 50 && item.stock_level < 250
    );
    this.highStock = this.allStock.filter(item => item.stock_level >= 250);
  }


  openUpdateView(item: stock): void {
    this.stockToUpdate = item;
    this.showUpdateView = true;
    this.showStockView = false;
    this.showCreateView = false;
  }

  handleFormClose(): void {
    this.showCreateView = false;
    this.showStockView = false;
    this.showUpdateView = false;
    this.showStructureView = false;
    this.preselectedTypeId = null;
    this.loadStock();
  }

  loadMaterials(): void {
    this.apiService.get_materials().subscribe({
      next: (response) => {
        this.materials = response as material[];
      },
      error: (err) => {
        console.error('Error loading materials:', err);
      }
    });
  }

viewStockFromStructure(item: any): void {
  this.viewStockItem = item.stock;
  this.showStockView = true;
  this.showCreateView = false;
  this.showUpdateView = false;
  this.showStructureView = false;
}

openUpdateViewFromStructure(item: any): void {
  this.stockToUpdate = item.stock;
  this.showUpdateView = true;
  this.showStockView = false;
  this.showCreateView = false;
  this.showStructureView = false;
}

  openCreateViewWithType(type: any): void {
    this.preselectedTypeId = type.type.stock_type_id;
    this.showCreateView = true;
    this.showStockView = false;
    this.showUpdateView = false;
    this.showStructureView = false;
  }

  loadStockTypes(): void {
    this.apiService.get_stock_types().subscribe({
      next: (response) => {
        this.stockTypes = response as stock_type[];
      },
      error: (err) => {
        console.error('Error loading stock types:', err);
      }
    });
  }

  loadStockCategories(): void {
    this.apiService.get_stock_categories().subscribe({
      next: (response) => {
        this.stockCategories = response as stock_category[];
      },
      error: (err) => {
        console.error('Error loading stock categories:', err);
      }
    });
  }

  exportMaterialToExcel(): void {
    this.apiService.export_material_to_excel().subscribe({
      next: (excelBlob: Blob) => {
        const date = new Date().toISOString().slice(0, 10);
        const filename = `materials_export_${date}.xlsx`;
        saveAs(excelBlob, filename);
        this.notification.showSuccess('Materials exported to Excel', 'Export Successful');
      },
      error: (err) => {
        console.error('Material export failed:', err);
        this.notification.showError('Failed to export materials. Please try again.', 'Export Failed');
      }
    });
  }

  importMaterialExcel(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = '';

    //  file type
    const validTypes = ['.xlsx', '.xls'];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validTypes.includes(fileExt)) {
      this.notification.showError('Invalid file type. Only Excel files are accepted.', 'Import Failed');
      return;
    }

    this.importResult = null;
    this.importing = true;

    this.apiService.import_material_excel(file).subscribe({
      next: (response) => {
        this.importing = false;

        if (response.error) {
          this.importResult = {
            success: false,
            message: 'Import Failed',
            description: response.error
          };
          this.notification.showError(response.error, 'Import Failed');
        } else {
          this.importResult = {
            success: true,
            message: 'Import Successful',
            description: `Added ${response.new_materials} new materials, skipped ${response.duplicates} duplicates`
          };

          this.notification.showSuccess(
            `Added ${response.new_materials} new materials, skipped ${response.duplicates} duplicates`,
            'Import Successful'
          );

          this.loadMaterials();
        }
      },
      error: (err) => {
        this.importing = false;
        console.error('Import failed:', err);
        this.importResult = {
          success: false,
          message: 'Import Failed',
          description: err.error?.error || 'Server error occurred'
        };
        this.notification.showError('Failed to import materials. Please try again.', 'Import Failed');
      }
    });
  }

  closeImportAlert(): void {
    this.importResult = null;
  }



  addCategory(): void {
    this.showCategoryModal = true;
    this.editingCategory = null;
    this.newCategoryName = '';
  }

  editCategory(category: any): void {
    this.showCategoryModal = true;
    this.editingCategory = category;
    this.newCategoryName = category.title;
  }

  saveCategory(): void {
    if (this.newCategoryName.trim()) {
      if (this.editingCategory) {
        this.apiService.updateStockCategory(this.editingCategory.category.stock_category_id, this.newCategoryName)
          .subscribe({
            next: () => {
              this.notification.showSuccess('Category updated successfully', 'Success');
              this.loadStockStructure();
              this.showCategoryModal = false;
            },
            error: (err) => {
              console.error('Error updating category:', err);
              this.notification.showError('Failed to update category', 'Error');
            }
          });
      } else {
        // Create new
        this.apiService.createStockCategory(this.newCategoryName)
          .subscribe({
            next: () => {
              this.notification.showSuccess('Category created successfully', 'Success');
              this.loadStockStructure();
              this.showCategoryModal = false;
            },
            error: (err) => {
              console.error('Error creating category:', err);
              this.notification.showError('Failed to create category', 'Error');
            }
          });
      }
    }
  }

  deleteCategory(category: any): void {
    if (confirm(`Are you sure you want to delete the category "${category.title}"?`)) {
      this.apiService.deleteStockCategory(category.category.stock_category_id)
        .subscribe({
          next: (response: any) => {
            if (response && response.error) {
              this.notification.showError(response.error, 'Delete Failed');
            } else {
              this.notification.showSuccess('Category deleted successfully', 'Success');
              this.loadStockStructure();
            }
          },
          error: (err) => {
            console.error('Error deleting category:', err);
            if (err.error && err.error.error && err.error.error.includes('foreign key constraint')) {
              this.notification.showError('Cannot delete category with existing types. Please move or delete types first.', 'Delete Restricted');
            } else {
              this.notification.showError('Failed to delete category', 'Error');
            }
          }
        });
    }
  }

  addType(category: any): void {
    this.showTypeModal = true;
    this.editingType = null;
    this.newTypeName = '';
    this.selectedCategoryId = category.category.stock_category_id;
  }

  editType(type: any): void {
    this.showTypeModal = true;
    this.editingType = type;
    this.newTypeName = type.title;
    this.selectedCategoryId = type.type.stock_category_id;
  }

  saveType(): void {
    if (this.newTypeName.trim() && this.selectedCategoryId) {
      if (this.editingType) {
        // Update existing type
        this.apiService.updateStockType(this.editingType.type.stock_type_id, this.newTypeName, this.selectedCategoryId)
          .subscribe({
            next: () => {
              this.notification.showSuccess('Type updated successfully', 'Success');
              this.loadStockStructure();
              this.showTypeModal = false;
            },
            error: (err) => {
              console.error('Error updating type:', err);
              this.notification.showError('Failed to update type', 'Error');
            }
          });
      } else {
        // Create new type
        this.apiService.createStockType(this.newTypeName, this.selectedCategoryId)
          .subscribe({
            next: () => {
              this.notification.showSuccess('Type created successfully', 'Success');
              this.loadStockStructure();
              this.showTypeModal = false;
            },
            error: (err) => {
              console.error('Error creating type:', err);
              this.notification.showError('Failed to create type', 'Error');
            }
          });
      }
    }
  }

  deleteType(type: any): void {
    if (confirm(`Are you sure you want to delete the type "${type.title}"?`)) {
      this.apiService.deleteStockType(type.type.stock_type_id)
        .subscribe({
          next: (response: any) => {
            // Check if the response indicates a restriction
            if (response && typeof response === 'object') {
              // Check for various patterns that might indicate restriction
              const hasRestriction =
                (response.error && response.error.includes('restrict')) ||
                (response.message && response.message.includes('restrict')) ||
                (response.detail && response.detail.includes('restrict')) ||
                (response.error && response.error.includes('constraint')) ||
                (response.message && response.message.includes('constraint')) ||
                (response.detail && response.detail.includes('constraint')) ||
                (response.error && response.error.includes('foreign key')) ||
                (response.message && response.message.includes('foreign key')) ||
                (response.detail && response.detail.includes('foreign key'));

              if (hasRestriction) {
                this.notification.showError('Cannot delete type with existing stock items. Please move or delete items first.', 'Delete Restricted');
              } else {
                this.notification.showSuccess('Type deleted successfully', 'Success');
                this.loadStockStructure();
              }
            } else {
              // Assume success for non-object responses
              this.notification.showSuccess('Type deleted successfully', 'Success');
              this.loadStockStructure();
            }
          },
          error: (err) => {
            console.error('Error deleting type:', err);

            // Check for restriction error in the error response
            const errorMsg = err.error?.error || err.error?.message || err.error?.detail || err.message || '';

            if (errorMsg.includes('restrict') || errorMsg.includes('constraint') || errorMsg.includes('foreign key')) {
              this.notification.showError('Cannot delete type with existing stock items. Please move or delete items first.', 'Delete Restricted');
            } else {
              this.notification.showError('Failed to delete type', 'Error');
            }
          }
        });
    }
  }

  deleteStock(stock: any): void {
    if (confirm(`Are you sure you want to delete the stock item "${stock.title}"?`)) {
      this.apiService.deleteStock(stock.stock.stock_id)
        .subscribe({
          next: () => {
            this.notification.showSuccess('Stock item deleted successfully', 'Success');
            this.loadStockStructure();
          },
          error: (err) => {
            console.error('Error deleting stock item:', err);
            this.notification.showError('Failed to delete stock item', 'Error');
          }
        });
    }
  }

// Remove the confirmation flow and make moves happen immediately
moveTypeToCategory(type: any, newCategoryId: any): void {
  const categoryId = typeof newCategoryId === 'number' ? newCategoryId : parseInt(newCategoryId, 10);

  if (!categoryId) {
    return; // Don't do anything if no valid selection
  }

  // Find the target category
  const targetCategory = this.stockCategories.find(c => c.stock_category_id === categoryId);

  if (!targetCategory) {
    this.notification.showError('Selected category not found', 'Error');
    return;
  }

  // Show a loading indicator
  this.isLoadingStructure = true;

  this.apiService.moveTypeToCategory(type.type.stock_type_id, categoryId)
    .subscribe({
      next: (response) => {
        this.isLoadingStructure = false;
        this.notification.showSuccess(`Type moved to ${targetCategory.category_name}`, 'Success');
        this.loadStockStructure(); // Reload the structure to reflect changes
      },
      error: (err) => {
        this.isLoadingStructure = false;
        console.error('Error moving type:', err);
        this.notification.showError('Failed to move type', 'Error');

        // Reset the dropdown selection
        this.loadStockStructure();
      }
    });
}

  moveStockToType(stock: any, newTypeId: any): void {
    const typeId = typeof newTypeId === 'number' ? newTypeId : parseInt(newTypeId, 10);

    if (!typeId) {
      return; // Don't do anything if no valid selection
    }

    // Find the target type
    const targetType = this.stockTypes.find(t => t.stock_type_id === typeId);

    if (!targetType) {
      this.notification.showError('Selected type not found', 'Error');
      return;
    }

    // Show a loading indicator
    this.isLoadingStructure = true;

    this.apiService.moveStockToType(stock.stock.stock_id, typeId)
      .subscribe({
        next: (response) => {
          this.isLoadingStructure = false;
          this.notification.showSuccess(`Stock item moved to ${targetType.type_name}`, 'Success');
          this.loadStockStructure(); // Reload the structure to reflect changes
        },
        error: (err) => {
          this.isLoadingStructure = false;
          console.error('Error moving stock:', err);
          this.notification.showError('Failed to move stock item', 'Error');

          // Reset the dropdown selection
          this.loadStockStructure();
        }
      });
  }

  toggleCategory(category: any): void {
    category.expanded = !category.expanded;
  }

  toggleType(type: any): void {
    type.expanded = !type.expanded;
  }

  initiateMoveType(type: any, newCategoryId: any): void {
    const categoryId = typeof newCategoryId === 'number' ? newCategoryId : parseInt(newCategoryId, 10);

    if (!categoryId) {
      this.notification.showError('Please select a valid category', 'Error');
      return;
    }

    // Store the move details for confirmation
    this.movingType = type;
    this.moveTarget = this.stockCategories.find(c => c.stock_category_id === categoryId);
    this.moveAction = 'type';
    this.showMoveConfirm = true;
  }

  initiateMoveStock(stock: any, newTypeId: any): void {
    const typeId = typeof newTypeId === 'number' ? newTypeId : parseInt(newTypeId, 10);

    if (!typeId) {
      this.notification.showError('Please select a valid type', 'Error');
      return;
    }

    // Store the move details for confirmation
    this.movingStock = stock;
    this.moveTarget = this.stockTypes.find(t => t.stock_type_id === typeId);
    this.moveAction = 'stock';
    this.showMoveConfirm = true;
  }

  // Confirm and execute the move
  confirmMove(): void {
    if (this.moveAction === 'type' && this.movingType && this.moveTarget) {
      this.executeMoveType();
    } else if (this.moveAction === 'stock' && this.movingStock && this.moveTarget) {
      this.executeMoveStock();
    }

    this.cancelMove();
  }

  // Execute type move
  executeMoveType(): void {
    this.isMoving = true;
    this.apiService.moveTypeToCategory(this.movingType.type.stock_type_id, this.moveTarget.stock_category_id)
      .subscribe({
        next: (response) => {
          this.isMoving = false;
          this.notification.showSuccess(`Type moved to ${this.moveTarget.category_name}`, 'Success');
          this.loadStockStructure();
        },
        error: (err) => {
          this.isMoving = false;
          console.error('Error moving type:', err);
          this.notification.showError('Failed to move type', 'Error');
        }
      });
  }

  // Execute stock move
  executeMoveStock(): void {
    this.apiService.moveStockToType(this.movingStock.stock.stock_id, this.moveTarget.stock_type_id)
      .subscribe({
        next: (response) => {
          this.notification.showSuccess(`Stock item moved to ${this.moveTarget.type_name}`, 'Success');
          this.loadStockStructure();
        },
        error: (err) => {
          console.error('Error moving stock:', err);
          this.notification.showError('Failed to move stock item', 'Error');
        }
      });
  }

  // Cancel move operation
  cancelMove(): void {
    this.movingType = null;
    this.movingStock = null;
    this.moveTarget = null;
    this.moveAction = null;
    this.showMoveConfirm = false;
  }
}
