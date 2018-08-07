import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService, Parse } from '../../services/parse.service';
import { PublicService } from '../../services/public.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit {
  private id = '';
  private project: {get: Function} = {get: Function};

  private get name() {
    return this.project.get && this.project.get('name');
  }

  constructor(private route: ActivatedRoute,
  private projectService: ProjectService,
private publicService: PublicService) { }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.projectService.subscribe((() => {
      this.project = this.projectService.projects[this.id] || {};
      this.publicService.setTitle(this.name);
    }).bind(this));
    this.projectService.reload();
  }

}
