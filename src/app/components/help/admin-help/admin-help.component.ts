import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { AppModule } from '../../../app.module';
import { AuthService } from '../../../services/auth.service';

interface FAQ {
  faq_id: number;
  faq_q: string;
  faq_a: string;
}

@Component({
  selector: 'app-admin-help',
  standalone: true,
  imports: [AppModule],
  templateUrl: './admin-help.component.html',
  styleUrl: './admin-help.component.less'
})
export class AdminHelpComponent implements OnInit{

  panels = [
    {
      name: 'Help PDF',
      active: true,
      disabled: false,
      icon: 'file-pdf',
      type: 'pdf'
    },
    {
      name: 'Help Video',
      active: false,
      disabled: false,
      icon: 'video-camera',
      type: 'video'
    },
    {
      name: 'FAQs',
      active: false,
      disabled: false,
      icon: 'question-circle',
      type: 'faq'
    }
  ];

  faqs: FAQ[] = [];
  filteredFaqs: FAQ[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  searchQuery = '';

  constructor(private apiService: ApiService, public auth:AuthService) {}

  ngOnInit(): void {
    this.loadFAQs();
  }

  loadFAQs(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.get_faqs().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.faqs = response;
          this.filteredFaqs = [...response];
        } else {
          this.errorMessage = 'Unexpected response format';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = `Failed to load FAQs (${err.status})`;
        this.isLoading = false;
      }
    });
  }

  filterFAQs(): void {
    if (!this.searchQuery.trim()) {
      this.filteredFaqs = [...this.faqs];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredFaqs = this.faqs.filter(faq =>
      faq.faq_q.toLowerCase().includes(query) ||
      faq.faq_a.toLowerCase().includes(query)
    );
  }
}
