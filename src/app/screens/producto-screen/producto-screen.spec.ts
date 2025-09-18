import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoScreen } from './producto-screen';

describe('ProductoScreen', () => {
  let component: ProductoScreen;
  let fixture: ComponentFixture<ProductoScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoScreen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductoScreen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
