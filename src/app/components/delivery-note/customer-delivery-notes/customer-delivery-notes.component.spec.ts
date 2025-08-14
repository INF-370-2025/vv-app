import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerDeliveryNotesComponent } from './customer-delivery-notes.component';

describe('CustomerDeliveryNotesComponent', () => {
  let component: CustomerDeliveryNotesComponent;
  let fixture: ComponentFixture<CustomerDeliveryNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerDeliveryNotesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomerDeliveryNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
