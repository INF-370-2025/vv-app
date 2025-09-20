import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingJobRequestsComponent } from './pending-job-requests.component';

describe('PendingJobRequestsComponent', () => {
  let component: PendingJobRequestsComponent;
  let fixture: ComponentFixture<PendingJobRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingJobRequestsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PendingJobRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
