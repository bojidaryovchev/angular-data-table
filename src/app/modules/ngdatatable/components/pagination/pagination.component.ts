import { Component, OnInit, Input, OnChanges, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent implements OnInit, OnChanges {
  readonly totalPages: number = 3;
  
  @Input() total: number;
  @Input() limit: number;
  @Input() currentPage: number = 0;
  
  @Output() pageChange: EventEmitter<number> = new EventEmitter();

  pages: number[] = [];

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.initPages();
  }

  ngOnChanges() {
    this.initPages();
  }

  navigate(page: number) {
    if (page < 0 || page * this.limit >= this.total) {
      return;
    }

    this.pageChange.emit(page + 1);
    this.currentPage = page;
    this.initPages();
    this.changeDetectorRef.markForCheck();
  }

  navigateToStart() {
    this.navigate(0);
  }

  navigateToEnd() {
    const totalPages = Math.ceil(this.total / this.limit);

    this.navigate(totalPages ? totalPages - 1 : 0);
  }

  private initPages() {
    if (!this.total || !this.limit) {
      return;
    }
    
    this.pages = [];

    const pagesCount = Math.ceil(this.total / this.limit);

    let i = this.currentPage ? this.currentPage - Math.floor(this.totalPages / 2) : 0;

    i = i < 0 ? 0 : i;

    if (pagesCount - this.currentPage <= Math.floor(this.totalPages / 2)) {
      i = pagesCount - this.totalPages;
    }

    for (let pages = 0; pages < this.totalPages && i < pagesCount; i++, pages++) {
      this.pages.push(i);
    }
  }
}
