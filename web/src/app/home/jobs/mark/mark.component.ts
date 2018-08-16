import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { Parse, ParseObject, ParseService } from '../../../services/parse.service';
import { ProjectService } from '../../../services/parse/project.service';
import { BBoxService, BBox } from '../../../services/parse/bbox.service';
import { Mark, MarkService } from '../../../services/parse/mark.service';
import { PublicService, Type } from '../../../services/public.service';

@Component({
  selector: 'app-mark',
  templateUrl: './mark.component.html',
  styleUrls: ['./mark.component.scss']
})
export class MarkComponent implements OnInit, AfterViewInit {
  private currentType = 0;  // current selected mark type
  private project: ParseObject = {};  // current project
  private job: ParseObject = {};  // current job
  private marks = [];
  private canRotate = false;

  private bboxs = {
    capture: false,
    current: {
      p1: new Type.Point(),
      p2: new Type.Point(),
      last: new Type.Point()
    },
    all: [],
    width: 1000,
    height: 1000
  };
  private get types() {
    return this.project.get && this.project.get('types') || [];
  }

  private currentFilter_ = Type.FilterTypes.Normal;
  private get currentFilter() {
    return this.currentFilter_;
  }
  private set currentFilter(v) {
    if (this.MarkFilters[v].count < 1) {
      this.snackBar.open("没有符合条件的图片", null, {
        duration: 1200,
        verticalPosition: 'top',
        panelClass: 'snack-bar'
      });
      return;
    }
    this.currentFilter_ = v;
    this.currentMarkIndex--;
    this.next({});
  }
  private MarkFilters = [
    { type: Type.FilterTypes.Normal, name: '未废弃', count: 0 },
    { type: Type.FilterTypes.Pure, name: '未处理', count: 0 },
    { type: Type.FilterTypes.UnMarked, name: '未标注', count: 0 },
    { type: Type.FilterTypes.Marked, name: '已标注', count: 0 },
    { type: Type.FilterTypes.Hided, name: '已废弃', count: 0 },
    { type: Type.FilterTypes.All, name: '全部', count: 0 }
  ];

  private currentMarkIndex = -1;  // current image url
  private get currentMark() {
    return (this.marks && this.marks[this.currentMarkIndex]) || {};
  }

  private get currentRectStyle() {
    return {
      'border-width': 2,
      'border-color': '#F00',
      left: Math.min(this.bboxs.current.p1.x, this.bboxs.current.p2.x) + 'px',
      top: Math.min(this.bboxs.current.p1.y, this.bboxs.current.p2.y) + 'px',
      width: Math.abs(this.bboxs.current.p2.x - this.bboxs.current.p1.x) + 'px',
      height: Math.abs(this.bboxs.current.p2.y - this.bboxs.current.p1.y) + 'px'
    };
  }
  private allRectStyle = [];

  constructor(
    private route: ActivatedRoute,
    private markService: MarkService,
    private bboxService: BBoxService,
    private publicService: PublicService,
    private parseService: ParseService,
    private snackBar: MatSnackBar
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
        this.countFilter();
        this.currentFilter = this.job.get('filter') || 0;
        this.currentMarkIndex = this.job.get('current') || 0;
        this.currentMarkIndex--;
        this.next(0);
      } catch (e) {
        console.error(e)
      }
    }
  }

  ngAfterViewInit() {
    let overlay: HTMLDivElement = document.querySelector('#overlay');
    if (overlay) {
      this.bboxs.width = overlay.clientWidth;
      this.bboxs.height = overlay.clientHeight;
    }
  }

  countFilter() {
    for (let filter of this.MarkFilters) {
      filter.count = 0;
    }
    for (let mark of this.marks) {
      for (let filter of this.MarkFilters) {
        switch (filter.type) {
          case Type.FilterTypes.Pure:
            !mark.hide && mark.bboxes.length < 1 && filter.count++;
            break;
          case Type.FilterTypes.Hided:
            mark.hide && filter.count++;
            break;
          case Type.FilterTypes.Marked:
            mark.bboxes.length > 0 && filter.count++;
            break;
          case Type.FilterTypes.UnMarked:
            mark.bboxes.length < 1 && filter.count++;
            break;
          case Type.FilterTypes.Normal:
            !mark.hide && filter.count++;
            break;
          default:
            filter.count++;
        }
      }
    }
  }

  checkIndex() {
    switch (this.currentFilter) {
      case Type.FilterTypes.Pure:
        return !this.currentMark.hide && !this.currentMark.marks;
      case Type.FilterTypes.Hided:
        return this.currentMark.hide;
      case Type.FilterTypes.Marked:
        return this.currentMark.marks;
      case Type.FilterTypes.UnMarked:
        return !this.currentMark.marks;
      case Type.FilterTypes.Normal:
        return !this.currentMark.hide;
      default:
        return true;
    }
  }
  pre(evt) {
    this.bboxs.all = [];
    let lastIndex = this.currentMarkIndex;
    this.currentMarkIndex = Math.max(0, this.currentMarkIndex - 1);
    if (evt.shiftKey) {
      this.currentMarkIndex = 1;
      return this.pre({});
    }
    if (lastIndex !== this.currentMarkIndex && !this.checkIndex()) {
      this.pre(evt);
      if (this.currentMarkIndex === 0 && !this.checkIndex()) {
        return this.next(evt);
      }
    }
    this.prepareBox();
    if (lastIndex === this.currentMarkIndex) {
      this.snackBar.open("前面没有了", null, {
        duration: 2000,
        verticalPosition: 'top'
      });
    }
  }
  next(evt) {
    this.bboxs.all = [];
    let lastIndex = this.currentMarkIndex;
    this.currentMarkIndex = Math.min(this.marks.length - 1, this.currentMarkIndex + 1);
    if (evt.shiftKey) {
      this.currentMarkIndex = this.marks.length - 2;
      return this.next({});
    }
    if (lastIndex !== this.currentMarkIndex && !this.checkIndex()) {
      this.next(evt);
      if (this.currentMarkIndex === this.marks.length - 1 && !this.checkIndex()) {
        return this.pre(evt);
      }
    }
    this.prepareBox();
    if (lastIndex === this.currentMarkIndex) {
      this.snackBar.open("后面没有了", null, {
        duration: 1200,
        verticalPosition: 'top',
        panelClass: 'snack-bar'
      });
    }
  }
  async mark() {
    try {
      let bbs = [];
      for (let rect of this.bboxs.all) {
        let bbox = new BBox();
        let x = (rect.p1.x + rect.p2.x) / 2;
        let y = (rect.p1.y + rect.p2.y) / 2;
        let w = Math.abs(rect.p1.x - rect.p2.x);
        let h = Math.abs(rect.p1.y - rect.p2.y);
        bbox.set('x', x / this.bboxs.width);
        bbox.set('y', y / this.bboxs.height);
        bbox.set('w', w / this.bboxs.width);
        bbox.set('h', h / this.bboxs.height);
        bbox.set('t', 0);
        bbox.set('label', this.currentType);
        bbox.set('user', Parse.User.current().toPointer());
        bbox.set('mark', this.currentMark.ref.toPointer());
        await bbox.save();
        bbs.push(bbox);
      }
      if (bbs.length) {
        this.currentMark.ref.get('bboxes').add(bbs);
        await this.currentMark.ref.save();
        for (let bbox of bbs) {
          this.currentMark.bboxes.push({
            x: bbox.get('x'),
            y: bbox.get('y'),
            w: bbox.get('w'),
            h: bbox.get('h'),
            t: bbox.get('t'),
            ref: bbox
          });
        }

      }
      this.job.set('current', this.currentMarkIndex);
      this.job.set('filter', this.currentFilter);
      await this.job.save();
      this.bboxs.all = [];
      this.next({});
    } catch (e) {
      console.error(e);
    }
  }
  async removeMark(style) {
    try {
      if (style.tmp) {
        this.bboxs.all['splice'](this.bboxs.all.indexOf(style.rect), 1);
      } else {
        this.currentMark.ref.get('bboxes').remove(style.rect.ref);
        await this.currentMark.ref.save();
        await this.parseService.destroy(style.rect.ref);
        this.currentMark.bboxes.splice(this.currentMark.bboxes.indexOf(style.rect), 1);
      }
      this.prepareBox();
    } catch (e) {
      console.error(e);
    }
  }
  async hide() {
    if (!this.currentMark) {
      return;
    }
    try {
      this.currentMark.hide = !this.currentMark.hide;
      this.job.set('current', this.currentMarkIndex);
      this.job.set('filter', this.currentFilter);
      await this.job.save();
      this.currentMark.ref.set('hide', this.currentMark.hide);
      await this.currentMark.ref.save();
      this.countFilter();
      this.next({});
    } catch (e) {
      console.error(e);
    }
  }

  prepareBox() {
    this.allRectStyle.splice(0, this.allRectStyle.length);
    for (let rect of this.bboxs.all) {
      this.allRectStyle.push({
        tmp: true,
        rect,
        left: Math.min(rect.p1.x, rect.p2.x) + 'px',
        top: Math.min(rect.p1.y, rect.p2.y) + 'px',
        width: Math.abs(rect.p2.x - rect.p1.x) + 'px',
        height: Math.abs(rect.p2.y - rect.p1.y) + 'px'
      });
    }
    if (this.currentMark.bboxes) {
      for (let rect of this.currentMark.bboxes) {
        this.allRectStyle.push({
          rect,
          left: (rect.x - rect.w / 2) * this.bboxs.width + 'px',
          top: (rect.y - rect.h / 2) * this.bboxs.height + 'px',
          width: rect.w * this.bboxs.width + 'px',
          height: rect.h * this.bboxs.height + 'px'
        });
      }
    }
  }
  onMouseDown(evt) {
    if (evt.button !== 0) {
      return;
    }
    this.bboxs.capture = true;
    this.bboxs.current.p1 = {
      x: evt.offsetX,
      y: evt.offsetY
    };
    this.bboxs.current.p2 = {
      x: evt.offsetX,
      y: evt.offsetY
    };
  }
  onMouseUp(evt) {
    if (evt.button === 2 && evt.shiftKey) { // delete
      let point = {
        x: evt.offsetX,
        y: evt.offsetY
      };
      for (let i in this.bboxs.all) {
        // if(thi.bboxs.all[i].p1.x )
      }
      return;
    }
    this.bboxs.current.p2 = {
      x: evt.offsetX,
      y: evt.offsetY
    };

    this.bboxs.capture = false;
    this.bboxs.all.push(
      {
        p1: this.bboxs.current.p1,
        p2: this.bboxs.current.p2
      }
    );
    this.bboxs.current.p1 = new Type.Point();
    this.bboxs.current.p2 = new Type.Point();
    this.bboxs.current.last = new Type.Point();
    this.prepareBox();
  }
  onMouseMove(evt) {
    if (!this.bboxs.capture) {
      return;
    }
    this.bboxs.current.p2 = {
      x: evt.offsetX,
      y: evt.offsetY
    };
    if (evt.shiftKey) {
      this.bboxs.current.p1.x += (this.bboxs.current.p2.x - this.bboxs.current.last.x);
      this.bboxs.current.p1.y += (this.bboxs.current.p2.y - this.bboxs.current.last.y);
    }
    this.bboxs.current.last = {
      x: evt.offsetX,
      y: evt.offsetY
    };
  }

}

