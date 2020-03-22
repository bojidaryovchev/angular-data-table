import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgDataTableModule } from './modules/ngdatatable/ngdatatable.module';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, NgDataTableModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
