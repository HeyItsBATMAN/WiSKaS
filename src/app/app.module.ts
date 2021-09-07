import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppComponent } from './app.component';
import { SubjectComponent } from './subject/subject.component';
import { ModuleComponent } from './module/module.component';
import { WeightingComponent } from './weighting/weighting.component';

const matModules = [
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatFormFieldModule,
  MatSelectModule,
  MatSlideToggleModule,
  MatExpansionModule,
  MatTooltipModule,
  MatSnackBarModule,
];

@NgModule({
  declarations: [AppComponent, SubjectComponent, ModuleComponent, WeightingComponent],
  imports: [BrowserModule, BrowserAnimationsModule, CommonModule, FormsModule, ...matModules],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
