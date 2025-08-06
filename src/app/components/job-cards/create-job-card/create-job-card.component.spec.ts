import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateJobCardComponent } from './create-job-card.component';

describe('CreateJobCardComponent', () => {
  let component: CreateJobCardComponent;
  let fixture: ComponentFixture<CreateJobCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateJobCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateJobCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
