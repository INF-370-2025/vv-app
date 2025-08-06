import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyHoursWorkedComponent } from './monthly-hours-worked.component';

describe('MonthlyHoursWorkedComponent', () => {
  let component: MonthlyHoursWorkedComponent;
  let fixture: ComponentFixture<MonthlyHoursWorkedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyHoursWorkedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MonthlyHoursWorkedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
