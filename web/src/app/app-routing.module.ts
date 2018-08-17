import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginGuardService, ProjectResolver, adminGuardService, AdminResolver, JobResolver } from './services/guard.service';

import { SignupComponent } from './user/signup/signup.component';
import { SigninComponent } from './user/signin/signin.component';
import { HomeComponent } from './home/home.component';
import { ProjectComponent } from './home/project/project.component';
import { SettingComponent } from './home/project/setting/setting.component';
import { JobComponent } from './home/project/job/job.component';
import { JobsComponent } from './home/jobs/jobs.component';
import { ResultComponent } from './home/jobs/result/result.component';
import { JobVisualComponent } from './home/jobs/job/job.component';
import { MarkComponent } from './home/jobs/mark/mark.component';

const routes: Routes = [
  {
    path: '', canActivate: [LoginGuardService], canActivateChild: [LoginGuardService], children: [
      {
        path: '', component: HomeComponent,
        resolve: {
          isAdmin: AdminResolver
        }
      },
      {
        path: 'project/:id', component: ProjectComponent,
        canActivate: [adminGuardService], canActivateChild: [adminGuardService],
        children: [
          { path: '', redirectTo: 'setting', pathMatch: 'full' },
          {
            path: 'setting', component: SettingComponent,
            data: { index: 0 },
            resolve: {
              project: ProjectResolver
            }
          },
          {
            path: 'job', component: JobComponent, data: { index: 1 },
            resolve: {
              project: ProjectResolver
            }
          },
        ]
      },
      {
        path: 'job/:id', component: JobsComponent, children: [
          { path: '', redirectTo: 'mark', pathMatch: 'full' },
          {
            path: 'mark', component: MarkComponent, data: { index: 0 }, resolve: {
              job: JobResolver
            }
          },
          { path: 'result', component: ResultComponent, data: { index: 1 }, resolve: { job: JobResolver } },
          { path: 'job', component: JobVisualComponent, data: { index: 2 }, resolve: { job: JobResolver } }
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
  exports: [RouterModule],
  providers: [JobResolver, ProjectResolver, AdminResolver]
})
export class AppRoutingModule { }
