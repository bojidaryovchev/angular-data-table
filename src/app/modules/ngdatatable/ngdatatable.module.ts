import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularResizedEventModule } from 'angular-resize-event';
import { SwiperConfigInterface, SwiperModule, SWIPER_CONFIG } from 'ngx-swiper-wrapper';
import { CheckboxComponent } from './components/checkbox/checkbox.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ResponsiveTableComponent } from './components/responsive-table/responsive-table.component';
import { SafeHtmlPipe } from './pipes/safeHtml.pipe';

const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
  direction: 'horizontal',
  slidesPerView: 'auto'
};

@NgModule({
  imports: [CommonModule, SwiperModule, AngularResizedEventModule],
  declarations: [PaginationComponent, ResponsiveTableComponent, CheckboxComponent, SafeHtmlPipe],
  providers: [
    {
      provide: SWIPER_CONFIG,
      useValue: DEFAULT_SWIPER_CONFIG
    }
  ],
  exports: [ResponsiveTableComponent]
})
export class NgDataTableModule {}
