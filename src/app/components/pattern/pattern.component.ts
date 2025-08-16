import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { NotificationService } from '../../services/notification.service';
import { CreatePatternComponent } from './create-pattern/create-pattern.component';
import { pattern } from '../../models/pattern';
import { pattern_type } from '../../models/pattern';

@Component({
  selector: 'app-pattern',
  standalone: true,
  imports: [AppModule, CreatePatternComponent],
  templateUrl: './pattern.component.html',
  styleUrls: ['./pattern.component.less']
})
export class PatternComponent implements OnInit {
  allPatterns: pattern[] = [];
  patterns: pattern[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  showCreateForm = false;
  patternTypes: pattern_type[] = [];
  showHelp: boolean = false;
  isDeleting: { [id: number]: boolean } = {};

  constructor(
    private apiService: ApiService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPatterns();
    this.loadPatternTypes();
  }

  showHelpModal(){
    this.showHelp = true;
  }
  loadPatterns(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.get_patterns().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.allPatterns = [...response];
          this.enrichPatternsWithTypes();
          this.patterns = [...this.allPatterns];
        } else {
          this.errorMessage = 'Unexpected response format';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = `Failed to load patterns (${err.status})`;
        this.isLoading = false;
      }
    });
  }

  loadPatternTypes(): void {
    this.apiService.get_pattern_types().subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.patternTypes = response;
          this.enrichPatternsWithTypes();
          this.patterns = [...this.allPatterns];
        }
      },
      error: (err) => {
        console.error('Error loading pattern types:', err);
      }
    });
  }

  private enrichPatternsWithTypes(): void {
    if (!this.patternTypes || this.patternTypes.length === 0) return;

    this.allPatterns = this.allPatterns.map(pattern => {
      const patternType = this.patternTypes.find(
        pt => pt.pattern_type_id === pattern.pattern_type_id
      );
      return {
        ...pattern,
        pattern_type: patternType
      };
    });
  }

  searchPatterns(event: any): void {
    const value = event.target.value.toLowerCase();

    if (!value.trim()) {
      this.patterns = [...this.allPatterns];
      return;
    }

    this.patterns = this.allPatterns.filter(pattern =>
      (pattern.pattern_id && pattern.pattern_id.toString().includes(value)) ||
      (pattern.design && pattern.design.toLowerCase().includes(value)) ||
      (pattern.pattern_type?.type_name && pattern.pattern_type.type_name.toLowerCase().includes(value)) ||
      (pattern.created_at && pattern.created_at.toLowerCase().includes(value))
    );
  }

  openCreateForm(): void {
    this.showCreateForm = true;
  }

  handleFormClose(): void {
    this.showCreateForm = false;
  }

  handlePatternCreated(): void {
    this.loadPatterns();
    this.showCreateForm = false;
  }

  deletePattern(pattern: pattern): void {
    // Add null check for pattern_id
    if (!pattern.pattern_id) {
      this.notification.showError('Error', 'Invalid pattern: missing ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this pattern?')) {
      return;
    }

    const patternId = pattern.pattern_id;
    this.isDeleting[patternId] = true;

    this.apiService.delete_pattern(patternId).subscribe({
      next: () => {
        this.notification.showSuccess('Success', 'Pattern deleted successfully');
        // Remove from local arrays
        this.allPatterns = this.allPatterns.filter(
          p => p.pattern_id !== patternId
        );
        this.patterns = this.patterns.filter(
          p => p.pattern_id !== patternId
        );
        this.isDeleting[patternId] = false;
      },
      error: (err) => {
        console.error('Error deleting pattern:', err);

        let errorMsg = 'Failed to delete pattern';
        if (err.status === 404) {
          errorMsg = 'Delete endpoint not found (404)';
        } else if (err.error?.detail) {
          errorMsg = err.error.detail;
        }

        this.notification.showError('Error', errorMsg);
        this.isDeleting[patternId] = false;
      }
    });
  }
}
