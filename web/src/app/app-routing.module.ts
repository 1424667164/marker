import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginGuardService } from './services/guard.service';

import { SignupComponent } from './user/signup/signup.component';
import { SigninComponent } from './user/signin/signin.component';
import { HomeComponent } from './home/home.component';
import { ProjectComponent } from './home/project/project.component';

const routes: Routes = [
  {
    path: '', canActivate: [LoginGuardService],
    children: [
      { path: '', component: HomeComponent },
      { path: ':id', component: ProjectComponent }
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
