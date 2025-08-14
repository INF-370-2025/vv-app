import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDeliveryNoteComponent } from './admin-delivery-note.component';

describe('AdminDeliveryNoteComponent', () => {
  let component: AdminDeliveryNoteComponent;
  let fixture: ComponentFixture<AdminDeliveryNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDeliveryNoteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminDeliveryNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
