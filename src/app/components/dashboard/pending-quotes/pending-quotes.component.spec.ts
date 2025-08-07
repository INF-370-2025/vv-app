import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingQuotesComponent } from './pending-quotes.component';

describe('PendingQuotesComponent', () => {
  let component: PendingQuotesComponent;
  let fixture: ComponentFixture<PendingQuotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingQuotesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PendingQuotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
