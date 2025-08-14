import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { AppModule } from '../../../app.module';

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  open: boolean;
}

@Component({
  selector: 'app-customer-help',
  standalone: true,
  imports: [AppModule],
  templateUrl: './customer-help.component.html',
  styleUrls: ['./customer-help.component.less']
})
export class CustomerHelpComponent {
  searchQuery = '';
  helpSections: HelpSection[] = [
    { id: 'job-requests', title: 'Job Requests', icon: 'container', open: true },
    { id: 'invoices', title: 'Invoices', icon: 'file-text', open: true },
    { id: 'quotations', title: 'Quotations', icon: 'dollar', open: true },
    { id: 'delivery-notes', title: 'Delivery Notes', icon: 'file-done', open: true }
  ];
  filteredSections: HelpSection[] = [];

  constructor(private apiService: ApiService, public auth: AuthService) {
    this.filteredSections = [...this.helpSections];
  }

  toggleSection(sectionId: string): void {
    const section = this.helpSections.find(s => s.id === sectionId);
    if (section) {
      section.open = !section.open;
    }
  }

  filterSections(): void {
    if (!this.searchQuery.trim()) {
      this.filteredSections = [...this.helpSections];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredSections = this.helpSections.filter(section =>
      section.title.toLowerCase().includes(query) ||
      this.sectionMatchesContent(section.id, query)
    );
  }

  private sectionMatchesContent(sectionId: string, query: string): boolean {
    // Implement content search logic based on section ID
    // In a real app, you might have actual content to search through
    // This is simplified for the example
    const contentMap: {[key: string]: string} = {
      'job-requests': 'create new service requests pending accepted rejected cancelled',
      'invoices': 'view manage payments upload proof of payment status unpaid paid',
      'quotations': 'review price quotes accept reject view details',
      'delivery-notes': 'access documents completed jobs deliveries view download'
    };

    return contentMap[sectionId]?.includes(query) || false;
  }
}
