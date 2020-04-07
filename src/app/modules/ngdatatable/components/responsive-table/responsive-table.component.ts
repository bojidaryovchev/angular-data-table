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
  ViewChildren,
  TemplateRef
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export enum DataType {
  String,
  Number,
  Date,
  Boolean,
  Template
}

export class TableHeader {
  title: string;
  dataType: DataType;
  property?: string;
  template?: TemplateRef<ElementRef<HTMLElement>>;
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
  private readonly _defaultObjectsPerPage: number = 20;

  private _originalObjects: object[];

  // the objects you want to display in the table
  @Input() set objects(objects: object[]) {
    if (objects) {
      this.filteredObjects = objects.slice();
      this._originalObjects = objects.slice();
    } else {
      this.filteredObjects = [];
      this._originalObjects = [];
    }
  }
  // the table headers you want to display
  @Input() tableHeaders: TableHeader[];
  // whether or not to show checkboxes
  @Input() selectableObjects: boolean = true;
  // the count of object per page
  @Input() objectsPerPage: number = this._defaultObjectsPerPage;
  // whether or not to show the search
  @Input() useSearch: boolean = true;
  // by default you can select an object by clicking anywhere in the row
  // if disabled you will be able to select only by clicking the checkbox
  @Input() wholeRowSelection: boolean = true;
  // the objects that are currently selected
  @Input() selectedObjects: object[] = [];

  // emits an array of the selected objects
  @Output() objectsSelected: EventEmitter<object[]> = new EventEmitter();
  // emits an object when a row is clicked
  @Output() objectClicked: EventEmitter<object> = new EventEmitter();

  @ViewChild('responsiveTable') responsiveTable: ElementRef<HTMLElement>;
  @ViewChild('fixedTableHeaders') fixedTableHeaders: ElementRef<HTMLElement>;
  @ViewChild('trTableHeaders') trTableHeaders: ElementRef<HTMLElement>;
  @ViewChildren('mobileRow') mobileRows: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('mobileRowsContainer') mobileRowsContainers: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('mobileHeader') mobileHeaders: QueryList<ElementRef<HTMLElement>>;

  filteredObjects: object[];
  ascendingByTableHeaderIndex: { [key: number]: boolean } = {};
  page: number = 1;
  searchSubject: Subject<string> = new Subject();
  dataType = DataType;
  subscriptions: Subscription[] = [];

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {
    this.changeDetectorRef.detach();
  }

  ngOnInit() {
    this.initSearchSubject();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['objects']) {
      this.resort();
    }

    if (changes['selectedObjects']) {
      this.handleSelectedObjects();
    }
  }

  ngAfterViewInit() {
    this.changeDetectorRef.detectChanges();

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

  get allSelected(): boolean {
    if (!this.selectedObjects) {
      return;
    }
    
    return this.selectedObjects.length === this._originalObjects.length;
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

  getObjectEnumeratedProperties(object: object): { property: string; tableHeader: TableHeader }[] {
    return this.tableHeaders.map(tableHeader => {
      return {
        property: object[tableHeader.property],
        tableHeader
      };
    });
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

  onObjectClicked(object: object) {
    this.objectClicked.emit(object);
  }

  objectIsSelected(object): boolean {
    if (!this.selectedObjects) {
      return;
    }

    return !!this.selectedObjects.find(o => o === object);
  }

  onSelectUnselectAll(selected: boolean): void {
    if (selected) {
      this.selectedObjects = this._originalObjects.slice();
    } else {
      this.selectedObjects = [];
    }

    this.changeDetectorRef.detectChanges();

    this.objectsSelected.emit(this.selectedObjects);
  }

  onSelectUnselectSingle(object: object): void {
    // O(n)
    const index = this.selectedObjects.findIndex(o => o === object);

    if (index !== -1) {
      // O(1)
      this.selectedObjects[index] = this.selectedObjects[this.selectedObjects.length - 1];
      this.selectedObjects.pop();
    } else {
      this.selectedObjects.push(object);
    }

    this.changeDetectorRef.detectChanges();

    this.objectsSelected.emit(this.selectedObjects);
  }

  onMobileObjectRowClick(e: Event, object: object): void {
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.onSelectUnselectSingle(object);
  }

  equalizeMobileRowsContainersScrolls(): void {
    const mobileRowsContainers = this.mobileRowsContainers.toArray().map(mobileRowsContainer => mobileRowsContainer.nativeElement);
    
    let different: boolean = false;

    for (let index = 1; index < mobileRowsContainers.length; index++) {
      const a: HTMLElement = mobileRowsContainers[index - 1];
      const b: HTMLElement = mobileRowsContainers[index];
      
      if (a.scrollTop !== b.scrollTop) {
        different = true;
      }
    }

    if (!different) {
      return;
    }

    let highest: number = 0;

    mobileRowsContainers.forEach(mobileRowsContainer => {
      if (mobileRowsContainer.scrollTop > highest) {
        highest = mobileRowsContainer.scrollTop;
      }
    });

    mobileRowsContainers.forEach(mobileRowsContainer => {
      mobileRowsContainer.scrollTop = highest;
    });
  }

  getObjectIndex(object: object): number {
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

  private resort(): void {
    const descendingIndex: number = Object.keys(this.ascendingByTableHeaderIndex)
      .map(k => this.ascendingByTableHeaderIndex[k])
      .findIndex(ascending => !ascending);

    if (descendingIndex === -1) {
      return;
    }

    this.sort(this.tableHeaders[descendingIndex], descendingIndex);
  }

  private initSearchSubject(): void {
    this.subscriptions.push(
      this.searchSubject.pipe(debounceTime(this._debounceTime)).subscribe(value => {
        this.executeSearch(value);
      })
    );
  }

  private executeSearch(value: string) {
    if (!value) {
      this.filteredObjects = this._originalObjects.slice();
    } else {
      this.filteredObjects = this._originalObjects.filter(o => {
        return Object.keys(o)
          .map(k => o[k])
          .find(v => `${v}`.toLowerCase().startsWith(value.toLowerCase()));
      });
    }

    // go back to page 1
    this.page = 1;

    // first change detection rerenders the items
    this.changeDetectorRef.detectChanges();
    // second change detection updates the scroll padding calculation
    this.changeDetectorRef.detectChanges();

    if (this.filteredObjects.length) {
      this.handleMobileHeadersHeights();
      this.handleMobileRowsHeights();
    }
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

  private handleSelectedObjects() {
    if (!this.selectedObjects) {
      this.selectedObjects = [];
    }
  }
}
