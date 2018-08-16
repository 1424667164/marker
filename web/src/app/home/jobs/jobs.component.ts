import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { ParseObject } from '../../services/parse.service';
import { JobService } from '../../services/parse/job.service';
import { PublicService } from '../../services/public.service';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss']
})
export class JobsComponent implements OnInit {
  private id = '';
  private currentMenu = 0;

  constructor(
    private route: ActivatedRoute,
    private publicService: PublicService
  ) { }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.route.url.subscribe(url => {
      if (this.route.children.length > 0) {
        this.currentMenu = this.route.snapshot.firstChild.data.index;
        if (this.route.snapshot.firstChild.data.job) {
          this.publicService.setTitle(this.route.snapshot.firstChild.data.job.get('name'));
        }
      }
    });
  }
}
