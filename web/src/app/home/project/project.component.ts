import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService, Parse, ParseObject } from '../../services/parse.service';
import { PublicService } from '../../services/public.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  private id = '';
  private newType = '';
  private currentType = 0;
  private project: ParseObject = {};

  private showAll = false;

  private get currentImage() {
    return 'https://gss0.bdstatic.com/94o3dSag_xI4khGkpoWK1HF6hhy/baike/c0%3Dbaike80%2C5%2C5%2C80%2C26/sign='
      + '9ca773455cdf8db1a8237436684ab631/728da9773912b31b7096bff48418367adbb4e171.jpg';
  }
  private get name() {
    return this.project.get && this.project.get('name');
  }
  private get types() {
    return this.project.get && this.project.get('types') || [];
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

  async addType() {
    try {
      if (!this.project.has('types')) {
        this.project.set('types', []);
      }
      this.project.addUnique('types', this.newType);
      await this.project.save();
      this.newType = '';
    } catch (e) {
      console.error(e);
    }
  }
  async removeType(type) {
    try {
      this.project.remove('types', type);
      await this.project.save();
    } catch (e) {
      console.error(e);
    }
  }

  onMouseDown(evt) {
    console.dir(evt);
  }
  onMouseUp(evt) {
    console.dir(evt);
  }
  onMouseMove(evt) {
  }

}
