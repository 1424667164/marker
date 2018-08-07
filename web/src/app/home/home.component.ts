import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';
import { ProjectService, Parse } from '../services/parse.service';
import { PublicService } from '../services/public.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private nameFormControl = new FormControl('', [
    Validators.required
  ]);
  private rootFormControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/([a-zA-Z]:)?((\\|\/)[^\\\?\/\*\|<>:"]+)+/)
  ]);
  private matcher = new MyErrorStateMatcher();

  private markers = [];
  private get isAdmin() {
    const user = Parse.User.current();
    return user && user.getUsername() === 'mboss';
  }
  private project = {
    name: '',
    root: ''
  };

  constructor(
    private route: Router,
    private projectService: ProjectService,
    private publicService: PublicService
  ) { }

  ngOnInit() {
    this.projectService.subscribe((() => {
      this.refresh();
    }).bind(this));
    this.projectService.reload();
    this.publicService.setTitle('');
  }
  ngOnDestroy () {
  }
  async refresh() {
    this.markers.splice(0, this.markers.length);
    for (let key in this.projectService.projects) {
      if (!this.projectService.projects.hasOwnProperty(key)) {
        continue;
      }
      this.markers.push({
        id: this.projectService.projects[key].id,
        name: this.projectService.projects[key].get('name'),
        root: this.projectService.projects[key].get('root'),
        updatedAt: this.projectService.projects[key].get('updatedAt')
      });
    }
  }
  async add() {
    if (this.projectService.add(this.project)) {
      this.project.name = '';
      this.project.root = '';
    }
  }
}
