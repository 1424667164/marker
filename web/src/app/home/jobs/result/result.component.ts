import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { ParseObject } from '../../../services/parse.service';
import { ProjectService } from '../../../services/parse/project.service';
import { PublicService, Type } from '../../../services/public.service';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss']
})
export class ResultComponent implements OnInit {
  private id = '';
  private resultString = '';
  private project: ParseObject = {};
  private job: ParseObject = {};
  private marks = [];

  private get images() {
    return this.project.get && this.project.get('images') || [];
  }
  private get types() {
    return this.project.get && this.project.get('types') || [];
  }


  constructor(
    private route: ActivatedRoute
  ) { }
  async ngOnInit() {
    this.job = this.route.snapshot.data.job;
    if (this.job) {
      try {
        this.project = await this.job.get('project').fetch();
        let marks_ = await this.job.get('marks').query().find();
        this.marks = [];
        for (let key in marks_) {
          let mark: any = {
            id: marks_[key].id,
            hide: marks_[key].get('hide') || false,
            bboxes: [],
            image: await marks_[key].get('image').fetch(),
            ref: marks_[key]
          };

          mark.url = mark.image.get('url');
          let bbs = await marks_[key].get('bboxes').query().find();
          for (let box of bbs) {
            mark.bboxes.push({
              label: box.get('label') || 0,
              x: box.get('x') || 0,
              y: box.get('y') || 0,
              w: box.get('w') || 0,
              h: box.get('h') || 0,
              t: box.get('t') || 0,
              ref: box
            });
          }
          this.marks.push(mark);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  async generateResult() {
    this.resultString = '# -*- coding: utf-8 -*-\n\n';
    this.resultString += '# 以下为类型信息:\nnames = [\n';
    for (let type of this.types) {
      this.resultString += `\t"${type}",\n`;
    }
    this.resultString += "]\n\n";

    this.resultString += '# 以下为标签信息:\n';
    this.resultString += 'marks = [\n';
    for (let mark of this.marks) {
      if (!mark.bboxes || !mark.bboxes.length) {
        continue;
      }
      this.resultString += '\t"' + mark.url + ' ';
      for (let bbox of mark.bboxes) {
        this.resultString += `${bbox.label},${bbox.x.toFixed(4)},${bbox.y.toFixed(4)},${bbox.w.toFixed(4)},${bbox.h.toFixed(4)},${bbox.t.toFixed(4)} `;
      }
      this.resultString += '",\n';
    }
    this.resultString += ']\n';
    
    // 固定处理程序内容
    this.resultString += '#以下为处理程序: \n';
  }
}
