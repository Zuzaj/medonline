import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricalConsultationsComponent } from './historical-consultations.component';

describe('HistoricalConsultationsComponent', () => {
  let component: HistoricalConsultationsComponent;
  let fixture: ComponentFixture<HistoricalConsultationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HistoricalConsultationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricalConsultationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
