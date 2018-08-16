import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { ParseObject } from '../../services/parse.service';
import { ProjectService, } from '../../services/parse/project.service';
import { PublicService } from '../../services/public.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  private id = '';
  private currentMenu = 0;
  private project: ParseObject = {};  // current project

  private get name() {
    return this.project.get && this.project.get('name');
  }
  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private publicService: PublicService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.route.url.subscribe(url => {
      if(this.route.children.length > 0) {
        this.currentMenu = this.route.snapshot.firstChild.data.index;
      }
    });

    this.id = this.route.snapshot.paramMap.get('id');
    let inited = false;
    this.projectService.subscribe({}, (() => {
      this.project = this.projectService.projects[this.id] || {};
      Promise.resolve().then(() => {
        if (!inited && this.project.id) {
          this.publicService.setTitle(this.name);
          inited = true;
        }
      });
    }).bind(this));
    this.projectService.reload();
  }
}
