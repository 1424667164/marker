import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginGuardService } from './services/guard.service';

import { SignupComponent } from './user/signup/signup.component';
import { SigninComponent } from './user/signin/signin.component';
import { HomeComponent } from './home/home.component';
import { ProjectComponent } from './home/project/project.component';
import { MarkComponent } from './home/project/mark/mark.component';
import { SettingComponent } from './home/project/setting/setting.component';
import { ResultComponent } from './home/project/result/result.component';
import { JobComponent } from './home/project/job/job.component';

const routes: Routes = [
  {
    path: '', canActivate: [LoginGuardService],
    children: [
      { path: '', component: HomeComponent },
      {
        path: ':id', component: ProjectComponent,
        children: [
          { path: '', component: MarkComponent, data: { index: 0 } },
          { path: 'setting', component: SettingComponent, data: { index: 1 } },
          { path: 'result', component: ResultComponent, data: { index: 2 } },
          { path: 'job', component: JobComponent, data: { index: 3 } },
        ]
      }
    ]
  },
  {
    path: 'user', children: [
      { path: 'signin', component: SigninComponent },
      { path: 'signup', component: SignupComponent }
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
