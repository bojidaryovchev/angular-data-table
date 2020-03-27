import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export enum DataType {
  String,
  Number,
  Date,
  Boolean
}

export class TableHeader {
  title: string;
  dataType: DataType;
  property: string;
}

@Component({
  selector: 'app-responsive-table',
  templateUrl: './responsive-table.component.html',
  styleUrls: ['./responsive-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsiveTableComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  private readonly _mobileWidth: number = 576;
  private readonly _debounceTime: number = 500;
  private readonly _defaultObjectsPerPage: number = 14;

  private _originalObjects: object[];

  @Input() set objects(objects: object[]) {
    this.filteredObjects = objects.slice();
    this._originalObjects = objects.slice();
  }
  @Input() tableHeaders: TableHeader[];
  @Input() selectableObjects: boolean = true;
  @Input() objectsPerPage: number = this._defaultObjectsPerPage;
  @Input() useSearch: boolean = true;

  @Output() objectsSelected: EventEmitter<object[]> = new EventEmitter();

  @ViewChild('responsiveTable') responsiveTable: ElementRef<HTMLElement>;
  @ViewChild('fixedTableHeaders') fixedTableHeaders: ElementRef<HTMLElement>;
  @ViewChild('trTableHeaders') trTableHeaders: ElementRef<HTMLElement>;
  @ViewChildren('mobileRow') mobileRows: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('mobileHeader') mobileHeaders: QueryList<ElementRef<HTMLElement>>;

  filteredObjects: object[];
  ascendingByTableHeaderIndex: { [key: number]: boolean } = {};
  page: number = 1;
  selectedByObjectIndex: { [key: number]: boolean } = {};
  allSelected: boolean;
  searchSubject: Subject<string> = new Subject();
  subscriptions: Subscription[] = [];

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.subscriptions.push(
      this.searchSubject.pipe(debounceTime(this._debounceTime)).subscribe(value => {
        if (!value) {
          this.filteredObjects = this._originalObjects.slice();
        } else {
          this.filteredObjects = this._originalObjects.filter(o => {
            return Object.keys(o)
              .map(k => o[k])
              .find(v => `${v}`.toLowerCase().startsWith(value.toLowerCase()));
          });
        }

        // first change detection rerenders the items
        this.changeDetectorRef.detectChanges();
        // second change detection updates the scroll padding calculation
        this.changeDetectorRef.detectChanges();

        if (this.filteredObjects.length) {
          this.handleMobileHeadersHeights();
          this.handleMobileRowsHeights();
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tableHeaders']) {
      this.initAscendingByTableHeaderIndex();
    }

    if (changes['objects']) {
      this.initSelectedByObjectIndex();
      this.resort();
    }
  }

  ngAfterViewInit() {
    this.onResized();
  }

  ngAfterViewChecked() {
    this.equalizeHeadersWidths();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  get mobile(): boolean {
    if (!this.responsiveTable) {
      return;
    }

    return this.responsiveTable.nativeElement.getBoundingClientRect().width <= this._mobileWidth;
  }

  onResized(): void {
    this.changeDetectorRef.detectChanges();

    this.handleMobileHeadersHeights();
    this.handleMobileRowsHeights();
  }

  sort(tableHeader: TableHeader, tableHeaderIndex: number): void {
    let equalityPredicate: (a: object, b: object) => number;

    switch (tableHeader.dataType) {
      case DataType.String:
        if (!this.ascendingByTableHeaderIndex[tableHeaderIndex]) {
          equalityPredicate = (a: object, b: object) => b[tableHeader.property].localeCompare(a[tableHeader.property]);
        } else {
          equalityPredicate = (a: object, b: object) => a[tableHeader.property].localeCompare(b[tableHeader.property]);
        }

        break;
      case DataType.Number:
        if (!this.ascendingByTableHeaderIndex[tableHeaderIndex]) {
          equalityPredicate = (a: object, b: object) => +b[tableHeader.property] - +a[tableHeader.property];
        } else {
          equalityPredicate = (a: object, b: object) => +a[tableHeader.property] - +b[tableHeader.property];
        }

        break;
      case DataType.Date:
        if (!this.ascendingByTableHeaderIndex[tableHeaderIndex]) {
          equalityPredicate = (a: object, b: object) => new Date(b[tableHeader.property]).getTime() - new Date(a[tableHeader.property]).getTime();
        } else {
          equalityPredicate = (a: object, b: object) => new Date(a[tableHeader.property]).getTime() - new Date(b[tableHeader.property]).getTime();
        }

        break;
      case DataType.Boolean:
        if (!this.ascendingByTableHeaderIndex[tableHeaderIndex]) {
          equalityPredicate = (a: object, b: object) => +b[tableHeader.property] - +a[tableHeader.property];
        } else {
          equalityPredicate = (a: object, b: object) => +a[tableHeader.property] - +b[tableHeader.property];
        }

        break;
    }

    this.filteredObjects.sort(equalityPredicate);

    this.ascendingByTableHeaderIndex[tableHeaderIndex] = !this.ascendingByTableHeaderIndex[tableHeaderIndex];

    Object.keys(this.ascendingByTableHeaderIndex)
      .filter(i => +i !== tableHeaderIndex)
      .forEach(i => {
        this.ascendingByTableHeaderIndex[i] = false;
      });

    this.changeDetectorRef.detectChanges();

    this.handleMobileHeadersHeights();
    this.handleMobileRowsHeights();
  }

  getObjectEnumeratedProperties(object: object): string[] {
    return this.tableHeaders.map(tableHeader => object[tableHeader.property]);
  }

  onSearch(value: string): void {
    this.searchSubject.next(value);
  }

  onClear(input: HTMLInputElement): void {
    this.onSearch((input.value = null));
  }

  onPageChanged(page: number) {
    this.page = page;

    this.changeDetectorRef.detectChanges();

    this.handleMobileHeadersHeights();
    this.handleMobileRowsHeights();
  }

  getPaginatedObjects(): object[] {
    const objects: object[] = [];

    const start: number = this.page === 1 ? 0 : (this.page - 1) * this.objectsPerPage;
    const end: number = this.page * this.objectsPerPage;

    for (let index = start; index < end && index < this.filteredObjects.length; index++) {
      objects.push(this.filteredObjects[index]);
    }

    return objects;
  }

  onSelectUnselectAll(selected: boolean): void {
    this.allSelected = selected;

    this.filteredObjects.forEach((_, i) => (this.selectedByObjectIndex[i] = selected));

    this.changeDetectorRef.markForCheck();

    this.objectsSelected.emit(this.getSelectedObjects());
  }

  onSelectUnselectSingle(index: number): void {
    this.selectedByObjectIndex[index] = !this.selectedByObjectIndex[index];

    this.changeDetectorRef.markForCheck();

    this.objectsSelected.emit(this.getSelectedObjects());
  }

  onMobileObjectRowClick(e: Event, index: number): void {
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.onSelectUnselectSingle(index);
  }

  getSelectedObjectIndex(object: object): number {
    return this._originalObjects.findIndex(o => o === object);
  }

  calculatePaddingRight(): number {
    if (!this.mobileRows.first) {
      return 0;
    }

    if (!this.mobileRows.first.nativeElement.getBoundingClientRect().width) {
      return 0;
    }

    return this.responsiveTable.nativeElement.getBoundingClientRect().width - this.mobileRows.first.nativeElement.getBoundingClientRect().width;
  }

  onTableScroll(e: Event): void {
    const element: HTMLElement = e.target as HTMLElement;

    this.fixedTableHeaders.nativeElement.scrollLeft = element.scrollLeft;

    if (this.fixedTableHeaders.nativeElement.scrollLeft < element.scrollLeft) {
      const delta: number = element.scrollLeft - this.fixedTableHeaders.nativeElement.scrollLeft;

      this.fixedTableHeaders.nativeElement.style.marginLeft = `-${delta}px`;
    } else {
      this.fixedTableHeaders.nativeElement.style.marginLeft = null;
    }

    const headersHeight: number = this.trTableHeaders.nativeElement.getBoundingClientRect().height;

    if (element.scrollTop > headersHeight) {
      this.trTableHeaders.nativeElement.classList.add('responsive-table-headers-invisible');
      this.fixedTableHeaders.nativeElement.classList.add('responsive-table-fixed-headers-visible');
    } else {
      this.trTableHeaders.nativeElement.classList.remove('responsive-table-headers-invisible');
      this.fixedTableHeaders.nativeElement.classList.remove('responsive-table-fixed-headers-visible');
    }
  }

  private initAscendingByTableHeaderIndex(): void {
    this.ascendingByTableHeaderIndex = {};

    this.tableHeaders.forEach((_, index) => {
      this.ascendingByTableHeaderIndex[index] = true;
    });
  }

  private resort(): void {
    const descendingIndex: number = Object.keys(this.ascendingByTableHeaderIndex)
      .map(k => this.ascendingByTableHeaderIndex[k])
      .findIndex(ascending => !ascending);

    if (descendingIndex === -1) {
      return;
    }

    this.sort(this.tableHeaders[descendingIndex], descendingIndex);
  }

  private initSelectedByObjectIndex(): void {
    this.selectedByObjectIndex = {};

    this.filteredObjects.forEach((_, i) => (this.selectedByObjectIndex[i] = false));
  }

  private getSelectedObjects(): object[] {
    return Object.keys(this.selectedByObjectIndex)
      .filter(k => this.selectedByObjectIndex[k])
      .map(k => this.selectedByObjectIndex[k]);
  }

  private handleMobileHeadersHeights(): void {
    if (!this.mobile) {
      return;
    }

    const mobileHeaders: HTMLElement[] = this.mobileHeaders.toArray().map(mobileHeader => mobileHeader.nativeElement);

    mobileHeaders.forEach(header => (header.style.height = null));

    let highest: number = 0;

    mobileHeaders.forEach(header => {
      const height: number = header.getBoundingClientRect().height;

      if (height > highest) {
        highest = height;
      }
    });

    mobileHeaders.forEach(header => {
      header.style.height = `${highest}px`;
    });
  }

  private handleMobileRowsHeights(): void {
    if (!this.mobile) {
      return;
    }

    const mobileRows: HTMLElement[] = this.mobileRows.toArray().map(mobileRow => mobileRow.nativeElement);

    mobileRows.forEach(row => (row.style.height = null));

    const totalPages = Math.floor(this._originalObjects.length / this.objectsPerPage);
    const objectsPerPage = this.page <= totalPages ? this.objectsPerPage : this._originalObjects.length - totalPages * this.objectsPerPage;

    for (let i = 0; i < objectsPerPage; i++) {
      let highest = 0;

      for (let page = 0; page < this.tableHeaders.length; page++) {
        const height = mobileRows[objectsPerPage * page + i].getBoundingClientRect().height;

        if (height > highest) {
          highest = height;
        }
      }

      for (let page = 0; page < this.tableHeaders.length; page++) {
        const element = mobileRows[objectsPerPage * page + i];

        element.style.height = `${highest}px`;
      }
    }
  }

  private equalizeHeadersWidths(): void {
    if (this.mobile) {
      return;
    }

    if (!this.trTableHeaders || !this.fixedTableHeaders) {
      return;
    }

    const trTableHeaders: HTMLElement[] = Array.from(this.trTableHeaders.nativeElement.children) as HTMLElement[];
    const fixedTableHeaders: HTMLElement[] = Array.from(this.fixedTableHeaders.nativeElement.children) as HTMLElement[];

    for (let index = 0; index < trTableHeaders.length; index++) {
      fixedTableHeaders[index].style.minWidth = `${trTableHeaders[index].getBoundingClientRect().width}px`;
    }
  }
}
