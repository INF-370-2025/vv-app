import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDeliveryNoteComponent } from './create-delivery-note.component';

describe('CreateDeliveryNoteComponent', () => {
  let component: CreateDeliveryNoteComponent;
  let fixture: ComponentFixture<CreateDeliveryNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDeliveryNoteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateDeliveryNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
