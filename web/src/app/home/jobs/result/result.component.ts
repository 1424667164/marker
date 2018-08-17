import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ParseObject, Parse } from '../../../services/parse.service';
// import pyString from 'src/assets/pystring';

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

  private get types() {
    return this.project.get && this.project.get('types') || [];
  }
  private get commit() {
    return this.job.get && this.job.get('commit') || 0;
  }
  private get rollback() {
    return this.job.get && this.job.get('rollback') || 0;
  }


  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) { }
  async ngOnInit() {
    this.job = this.route.snapshot.data.job;
    if (this.job) {
      try {
        this.project = await this.job.get('project').fetch();
      } catch (e) {
        console.error(e);
      }
    }
  }

  async fetchMarks(job) {
    if (!job || !job.get) {
      return [];
    }
    let marks = [];
    try {
      let marks_ = await job.get('marks').query().find();
      for (let key in marks_) {
        let mark: any = {
          id: marks_[key].id,
          hide: marks_[key].get('hide') || false,
          bboxes: [],
          url: (await marks_[key].get('image').fetch()).get('url'),
          job: job.get('name'),
          ref: marks_[key]
        };

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
        marks.push(mark);
      }
      let pre = await job.get('pre').query().find();
      for(let j of pre) {
        let pMarks = await this.fetchMarks(j);
        marks.push(...pMarks);
      }
    } catch (e) {
      console.error(e);
    }
    return marks;
}

async generateResult() {
  this.resultString = '# -*- coding: utf-8 -*-\n';
  let decoder = new TextDecoder();
  let res: ArrayBuffer = await this.http.get('assets/import.txt', {
    headers: {
      'Content-Type': 'text/plain'
    },
    responseType: 'arraybuffer'
  }).toPromise();
  this.resultString += decoder.decode(res);

  this.resultString += '\n\n# 根路径 请按需修改\n';
  this.resultString += 'wd = \'/home/mboss/Documents/darknet/barcode\'\n';
  this.resultString += '# 项目标识 请按需修改\n';
  this.resultString += 'sets = \'barcode\'\n\n\n';

  this.resultString += '# 以下为类型信息:\nnames = [\n';
  for (let type of this.types) {
    this.resultString += `\t"${type}",\n`;
  }
  this.resultString += "]\n";

  this.resultString += '# 以下为标签信息:\n';
  this.resultString += 'marks = [\n';
  let marks = await this.fetchMarks(this.job);
  for (let mark of marks) {
    if (!mark.bboxes || !mark.bboxes.length) {
      continue;
    }
    this.resultString += '\t"' + mark.url + ' ';
    for (let bbox of mark.bboxes) {
      this.resultString += `${bbox.label},${bbox.x.toFixed(4)},${bbox.y.toFixed(4)},${bbox.w.toFixed(4)},${bbox.h.toFixed(4)},${bbox.t.toFixed(4)} `;
    }
    this.resultString += '",\n';
  }
  this.resultString += ']\n\n\n';

  // 固定处理程序内容
  this.resultString += '#以下为处理程序: \n';
  res = await this.http.get('assets/pytemplate.txt', {
    headers: {
      'Content-Type': 'text/plain'
    },
    responseType: 'arraybuffer'
  }).toPromise();
  this.resultString += decoder.decode(res);
}

async commit_() {
  if (this.job) {
    this.job.increment('commit');
    this.job.addUnique('logs', `the ${this.commit}th commit by ${Parse.User.current().get('username')}`);
    await this.job.save();
  }
}
}
