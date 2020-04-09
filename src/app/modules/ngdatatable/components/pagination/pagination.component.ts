import { Component, OnInit, Input, OnChanges, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent implements OnInit, OnChanges {
  private readonly _defaultShownPagesCount: number = 3;

  @Input() total: number;
  @Input() limit: number;
  @Input() shownPagesCount: number = this._defaultShownPagesCount;
  @Input() currentPage: number = 1;

  @Output() pageChange: EventEmitter<number> = new EventEmitter();

  pages: number[] = [];

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.initPages();
  }

  ngOnChanges() {
    this.initPages();
  }

  get totalPagesCount(): number {
    return this.total < this.limit ? 1 : Math.ceil(this.total / this.limit);
  }

  navigate(page: number) {
    if (page < 1 || page > this.totalPagesCount) {
      return;
    }

    this.pageChange.emit((this.currentPage = page));
    this.initPages();
    this.changeDetectorRef.markForCheck();
  }

  navigateToStart() {
    this.navigate(1);
  }

  navigateToEnd() {
    this.navigate(this.totalPagesCount || 1);
  }

  private initPages() {
    if (!this.total || !this.limit) {
      return;
    }

    if (this.totalPagesCount === 1) {
      this.pages = [1];
    } else if (this.totalPagesCount === 2) {
      this.pages = [1, 2];
    } else {
      this.pages = [];

      let delta: number = 0;

      if (this.currentPage <= Math.floor(this.shownPagesCount / 2)) {
        delta = this.currentPage - 1;
      } else if (this.currentPage > this.totalPagesCount - Math.floor(this.shownPagesCount / 2)) {
        delta = 2 * Math.floor(this.shownPagesCount / 2) + this.currentPage - this.totalPagesCount;
      } else {
        delta = Math.floor(this.shownPagesCount / 2);
      }

      for (let page = this.currentPage - delta, pagesCount = 0; page <= this.totalPagesCount && pagesCount < this.shownPagesCount; page++, pagesCount++) {
        this.pages.push(page);
      }
    }
  }
}
