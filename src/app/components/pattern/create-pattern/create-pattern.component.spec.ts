import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePatternComponent } from './create-pattern.component';

describe('CreatePatternComponent', () => {
  let component: CreatePatternComponent;
  let fixture: ComponentFixture<CreatePatternComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePatternComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreatePatternComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
