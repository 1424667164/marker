import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SigninComponent } from './user/signin/signin.component';
import { SignupComponent } from './user/signup/signup.component';
import { HomeComponent } from './home/home.component';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatListModule,
  MatExpansionModule,
  MatToolbarModule,
  MatTabsModule,
  MatCheckboxModule,
  MatSelectModule,
  MatCardModule,
  MatChipsModule,
  MatTooltipModule,
  MatSnackBarModule,
  MatDialogModule
} from '@angular/material';
import {MatIconModule} from '@angular/material/icon';
import { ProjectComponent } from './home/project/project.component';
import { SettingComponent } from './home/project/setting/setting.component';
import { JobComponent } from './home/project/job/job.component';
import { JobsComponent } from './home/jobs/jobs.component';
import { MarkComponent } from './home/jobs/mark/mark.component';
import { ResultComponent } from './home/jobs/result/result.component';
import { JobVisualComponent } from './home/jobs/job/job.component';
import { PanelVisualComponent } from './home/jobs/job//panel/panel.component';
import { AdminDirective } from './directives/admin.directive';
import { PanelComponent } from './home/project/job/panel/panel.component';
import { LinkDirective } from './directives/link.directive';
import { ConformComponent } from './home/dialog/conform/conform.component';
import { SetmarksComponent } from './home/dialog/setmarks/setmarks.component';

import { CustomReuseStrategy } from './services/public.service';


@NgModule({
  declarations: [
    AppComponent,
    SigninComponent,
    SignupComponent,
    HomeComponent,
    ProjectComponent,
    JobsComponent,
    MarkComponent,
    SettingComponent,
    ResultComponent,
    JobVisualComponent,
    PanelVisualComponent,
    JobComponent,
    AdminDirective,
    PanelComponent,
    LinkDirective,
    ConformComponent,
    SetmarksComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatToolbarModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSelectModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    AppRoutingModule
  ],
  entryComponents: [SetmarksComponent, ConformComponent],
  providers: [{provide: RouteReuseStrategy, useClass: CustomReuseStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
