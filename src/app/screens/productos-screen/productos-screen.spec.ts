import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosScreen } from './productos-screen';

describe('ProductosScreen', () => {
  let component: ProductosScreen;
  let fixture: ComponentFixture<ProductosScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosScreen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosScreen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
