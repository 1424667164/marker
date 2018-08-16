import { Component, OnInit, OnDestroy, Inject, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { Parse, ParseService } from '../services/parse.service';
import { PublicService, CustomErrorStateMatcher } from '../services/public.service';
import { ProjectService, Project } from '../services/parse/project.service';
import { JobService } from '../services/parse/job.service';
import { ConformComponent } from './dialog/conform/conform.component';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private nameFormControl: FormControl = null;
  private descriptionFormControl: FormControl = null;

  private addingProject = false;
  private markers = [];
  private jobs = [];
  private get isAdmin() {
    return this.route.snapshot.data.isAdmin;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private jobService: JobService,
    private publicService: PublicService,
    private matcher: CustomErrorStateMatcher,
    private dialog: MatDialog,
    private parseService: ParseService,
    private snackBar: MatSnackBar
  ) {
    this.nameFormControl = matcher.formControl(true);
    this.descriptionFormControl = matcher.formControl();
  }

  async ngOnInit() {
    // projects
    let whereString = this.projectService.subscribe({}, ((projects) => {
      this.markers.splice(0, this.markers.length);
      for (let key in projects) {
        if (!projects.hasOwnProperty(key)) {
          continue;
        }
        this.markers.push({
          id: projects[key].id,
          name: projects[key].get('name'),
          description: projects[key].get('description'),
          updatedAt: projects[key].get('updatedAt')
        });
      }
    }).bind(this));
    this.projectService.reload(whereString);
    this.publicService.setTitle('');

    // jobs
    if(!Parse.User.current().toPointer){
      return;
    }
    let whereStringJob = this.jobService.subscribe({ user: Parse.User.current().toPointer() }, async (jobs) => {
      this.jobs = [];
      for (let key in jobs) {
        if(jobs[key].get('user').id !== Parse.User.current().id) {
          // continue;
        }
        this.jobs.push({
          id: jobs[key].id,
          name: jobs[key].get('name'),
          active: jobs[key].get('active') || true,
          commit: jobs[key].get('commit') || 0,
          rollback: jobs[key].get('rollback') || 0,
          // user: jobs[key].get('user'),
          pre: await jobs[key].get('pre').query().find(),
          preCount: 0,
          // next: await jobs[key].get('next').query().find(),
          // nextCount: 0,
          marks: await jobs[key].get('marks').query().find(),
          ref: jobs[key]
        });
      }
      for (let job of this.jobs) {
        for (let pre of job.pre) {
          job.preCount++;
          if (!(pre.attributes.commit > pre.attributes.rollback)) {
            job.active = false;
          }
        }
      }
    });
    this.jobService.reload(whereStringJob);
  }
  
  select(id,) {
    this.router.navigate(['/project/', id]);
  }
  async add() {
    const project = new Project();
    project.set('name', this.nameFormControl.value);
    project.set('description', this.descriptionFormControl.value);
    let res = await this.parseService.add(project);
    if (res.code === 119) {
      this.snackBar.open("您没有新建权限！", null, {
        duration: 2000,
        verticalPosition: 'top'
      });
    } else {
      this.nameFormControl.reset();
      this.descriptionFormControl.reset();
      this.addingProject = false;
    }
  }
  async delete(id, evt: MouseEvent) {
    evt.stopPropagation();
    if (!this.projectService.projects[id]) {
      return;
    }
    let dlg = this.dialog.open(ConformComponent, { width: '250px', data: this.projectService.projects[id].get('name') });
    dlg.afterClosed().subscribe(async result => {
      if (result) {
        let res: { code: number } = await this.parseService.destroy(this.projectService.projects[id]);
        if (res.code === 119) {
          this.snackBar.open("您没有删除权限！", null, {
            duration: 2000,
            verticalPosition: 'top'
          });
          Promise.resolve().then(() => { this.projectService.reload() });
        }
      }
    });
  }

  ngOnDestroy() {
  }
}
