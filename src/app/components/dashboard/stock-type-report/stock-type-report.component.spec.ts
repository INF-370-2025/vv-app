import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockTypeReportComponent } from './stock-type-report.component';

describe('StockTypeReportComponent', () => {
  let component: StockTypeReportComponent;
  let fixture: ComponentFixture<StockTypeReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockTypeReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StockTypeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
