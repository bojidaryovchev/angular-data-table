import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent {
  @ViewChild('wrapper') wrapper: ElementRef<HTMLElement>;

  @Input() isChecked: boolean;

  @Output() checked: EventEmitter<boolean> = new EventEmitter();

  onChecked(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.checked.emit((this.isChecked = !this.isChecked));
  }
}
