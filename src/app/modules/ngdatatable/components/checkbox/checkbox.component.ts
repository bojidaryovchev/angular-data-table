import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent {
  @Input() isChecked: boolean;
  @Input() disabled: boolean;

  @Output() checked: EventEmitter<boolean> = new EventEmitter();

  onChecked(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.checked.emit((this.isChecked = !this.isChecked));
  }
}
