import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JobService, Job } from '../../../services/parse/job.service';
import { UserService } from '../../../services/parse/user.service';
import { ParseObject } from '../../../services/parse.service';
import { Type } from '../../../services/public.service';
import { LinkDirective } from '../../../directives/link.directive';

enum MouseAction {
  Move = 0,
  Scale,
  Click,
  DClick,
  RClick,
  DRClick,
  None
};
declare interface StyleObject {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  scale?: number;
  minLeft?: number,
  minTop?: number,
  orignX?: number,
  orignY?: number,
  cursor?: string,
  transitionDuration?: string,
  parentW?: number,
  parentH?: number
}

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss']
})
export class JobVisualComponent implements OnInit, AfterViewInit {
  @ViewChild(LinkDirective)
  private linkCanvas: LinkDirective = null;
  private linking = false;

  private thisJob: ParseObject = {};
  private project: ParseObject = {};
  private users = [];
  private jobs = [];

  private currentVector: Type.Vector3 = new Type.Vector3([0, 0, 1]);
  private translateMatrix: Type.Matrix3 = new Type.Matrix3([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  private scaleMatrix: Type.Matrix3 = new Type.Matrix3([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  private artBoardStyle_: StyleObject = {};
  private artBoardStyle = {};
  private viewport = { x: 0, y: 5000, w: 0, h: 5000 }   // 当前可见视口区域
  // mouse action
  private mouseAction = MouseAction.None;
  private lastMousePoint: Type.Point = { x: 0, y: 0 };

  private contentMenuStyle: any = {};

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService,
    private userService: UserService
  ) { }

  async ngOnInit() {
    // this.userService.subscribe({}, (users) => {
    //   this.users.splice(0, this.users.length);
    //   for (let key in users) {
    //     this.users.push({
    //       name: users[key].get('username'),
    //       ref: users[key]
    //     });
    //   }
    // });
    // this.userService.reload();
    this.thisJob = this.route.snapshot.data.job || {};
    if (this.thisJob.get && this.thisJob.get('project')) {
      try {
        this.project = await this.thisJob.get('project').fetch();
      } catch (e) {
        console.error(e);
      }
    }
    
    if (this.project.toPointer) {
      let whereString = this.jobService.subscribe({ project: this.project.toPointer() }, async (jobs) => {
        let jobs_ = [];
        for (let key in jobs) {
          jobs_.push({
            name: jobs[key].get('name'),
            active: jobs[key].get('active') || true,
            commit: jobs[key].get('commit') || 0,
            rollback: jobs[key].get('rollback') || 0,
            x: jobs[key].get('posX'),
            y: jobs[key].get('posY'),
            user: jobs[key].get('user'),
            logs: jobs[key].get('logs'),
            pre: [],
            next: [],
            marks: await jobs[key].get('marks').query().find(),
            current: jobs[key].id === this.thisJob.id,
            ref: jobs[key]
          });
        }
        for (let job of jobs_) {
          let nexts = await job.ref.get('next').query().find();
          for (let next of nexts) {
            for (let j of jobs_) {
              if (j.ref.id === next.id) {
                job.next.push(j);
                j.pre.push(job);
                if (job.commit <= job.rollback) {
                  j.active = false;
                }
                if(j.current) {
                  job.preJob = true;
                }
                break;
              }
            }
          }
        }
        this.jobs = jobs_;
      });
      this.jobService.reload(whereString);
    }
  }

  ngAfterViewInit() {
    let artBoard: HTMLDivElement = document.querySelector('#jobs');
    Promise.resolve().then(() => {
      this.artBoardStyle_.height = artBoard.clientHeight;
      this.artBoardStyle_.width = artBoard.clientWidth;
      this.artBoardStyle_.scale = 1;
      this.artBoardStyle_.top = artBoard.parentElement.clientHeight / 2 - artBoard.clientHeight / 2;
      this.artBoardStyle_.left = artBoard.parentElement.clientWidth / 2 - artBoard.clientWidth / 2;
      this.artBoardStyle_.parentW = artBoard.parentElement.clientWidth;
      this.artBoardStyle_.parentH = artBoard.parentElement.clientHeight;
      this.viewport = {
        x: this.artBoardStyle_.width / 2 - 0 - this.artBoardStyle_.parentW / 2,
        y: this.artBoardStyle_.width / 2 - 0 - this.artBoardStyle_.parentH / 2,
        w: this.artBoardStyle_.parentW,
        h: this.artBoardStyle_.parentH
      }
    });
  }

  onMouseDown(evt: MouseEvent) {
    if (evt.button === 1) {
      evt.srcElement.setPointerCapture(1);
      this.mouseAction = MouseAction.Move;
      this.lastMousePoint = {
        x: evt.clientX,
        y: evt.clientY
      };
    } else {
      this.mouseAction = MouseAction.None;
    }
  }
  onMouseUp(evt) {
    this.mouseAction = MouseAction.None;
    this.artBoardStyle_.cursor = 'default';
    this.artBoardStyle_.transitionDuration = '0.3s';

    this.update(0);
    if (evt.button === 0) {
      this.contentMenuStyle.display = 'none';
    }
  }
  onMouseMove(evt) {
    if (this.mouseAction === MouseAction.Move) {
      window.captureEvents();
      this.artBoardStyle_.cursor = 'pointer';
      this.artBoardStyle_.transitionDuration = '0s';
      this.translateMatrix.set([
        [0, 0, this.translateMatrix[0][2] + (evt.clientX - this.lastMousePoint.x) / this.artBoardStyle_.scale],
        [0, 0, this.translateMatrix[1][2] + (evt.clientY - this.lastMousePoint.y) / this.artBoardStyle_.scale],
        [0, 0, 1]
      ]);
      this.lastMousePoint = {
        x: evt.clientX,
        y: evt.clientY
      };

      this.update(50);
    }

  }
  onMouseWheel(evt) {
    this.artBoardStyle_.transitionDuration = '0s';
    this.artBoardStyle_.scale = Math.max(0.5, Math.min(this.artBoardStyle_.scale * (1 + (evt.wheelDelta / 120 / 20)), 2));

    this.scaleMatrix.set([
      [Math.max(0.5, Math.min(this.scaleMatrix[0][0] * (1 + (evt.wheelDelta / 120 / 20)), 2)), 0, 0],
      [0, Math.max(0.5, Math.min(this.scaleMatrix[1][1] * (1 + (evt.wheelDelta / 120 / 20)), 2)), 0],
      [0, 0, 1],
    ]);

    this.update(0);
    this.contentMenuStyle.display = 'none';
  }

  update(padding = 50) {
    this.currentVector = this.scaleMatrix.product(this.translateMatrix.product(this.currentVector));
    let x = this.currentVector[0];
    x = Math.min(this.artBoardStyle_.scale * this.artBoardStyle_.width / 2 - this.artBoardStyle_.parentW / 2 + padding, x);
    x = Math.max(this.artBoardStyle_.parentW / 2 - this.artBoardStyle_.scale * this.artBoardStyle_.width / 2 - padding, x);
    let y = this.currentVector[1];
    y = Math.min(this.artBoardStyle_.scale * this.artBoardStyle_.height / 2 - this.artBoardStyle_.parentH / 2 + padding, y);
    y = Math.max(this.artBoardStyle_.parentH / 2 - this.artBoardStyle_.scale * this.artBoardStyle_.height / 2 - padding, y);
    this.artBoardStyle = {
      left: this.artBoardStyle_.left + x + 'px',
      top: this.artBoardStyle_.top + y + 'px',
      'transform': 'scale(' + this.artBoardStyle_.scale + ')',
      cursor: this.artBoardStyle_.cursor,
      'transition-duration': this.artBoardStyle_.transitionDuration
    };
    this.translateMatrix.set([
      [0, 0, x / this.artBoardStyle_.scale],
      [0, 0, y / this.artBoardStyle_.scale],
      [0, 0, 1]
    ]);
    this.viewport = {
      x: this.artBoardStyle_.width / 2 - x / this.artBoardStyle_.scale - this.artBoardStyle_.parentW / 2 / this.artBoardStyle_.scale,
      y: this.artBoardStyle_.width / 2 - y / this.artBoardStyle_.scale - this.artBoardStyle_.parentH / 2 / this.artBoardStyle_.scale,
      w: this.artBoardStyle_.parentW / this.artBoardStyle_.scale,
      h: this.artBoardStyle_.parentH / this.artBoardStyle_.scale
    }
  }

}
