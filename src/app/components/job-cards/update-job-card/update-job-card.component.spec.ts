import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateJobCardComponent } from './update-job-card.component';

describe('UpdateJobCardComponent', () => {
  let component: UpdateJobCardComponent;
  let fixture: ComponentFixture<UpdateJobCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateJobCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdateJobCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
