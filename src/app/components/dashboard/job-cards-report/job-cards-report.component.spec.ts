import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobCardsReportComponent } from './job-cards-report.component';

describe('JobCardsReportComponent', () => {
  let component: JobCardsReportComponent;
  let fixture: ComponentFixture<JobCardsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardsReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JobCardsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
