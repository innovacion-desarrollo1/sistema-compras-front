import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-product-search-autocomplete',
  imports: [],
  templateUrl: './product-search-autocomplete.html',
  styleUrl: './product-search-autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSearchAutocomplete {}
