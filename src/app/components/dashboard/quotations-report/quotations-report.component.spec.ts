import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotationsReportComponent } from './quotations-report.component';

describe('QuotationsReportComponent', () => {
  let component: QuotationsReportComponent;
  let fixture: ComponentFixture<QuotationsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationsReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuotationsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
