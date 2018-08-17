import { Component, OnInit, OnDestroy, Input, Output, AfterContentInit, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { UserService } from '../../../../services/parse/user.service';
import { ParseService } from '../../../../services/parse.service';
import { ConformComponent } from '../../../dialog/conform/conform.component';
import { SetmarksComponent } from '../../../dialog/setmarks/setmarks.component';

@Component({
  selector: 'job-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss']
})
export class PanelComponent implements OnInit, OnDestroy, AfterContentInit {
  private job_: any = {};
  @Input()
  set job(j) {
    this.job_ = j;
    if (this.job_.user) {
      for (let user of this.users) {
        if (this.job_.user.id === user.ref.id) {
          this.job_.user = user.ref;
          break;
        }
      }
    }
  }
  get job(): any {
    return this.job_;
  }
  @Input()
  scale = 1;
  @Input()
  project: any = {};

  @Output()
  startlink = new EventEmitter();
  @Output()
  stoplink = new EventEmitter();
  @Output()
  movelink = new EventEmitter();

  private users = [];
  private moving = false;
  private lastMousePosition = { x: 0, y: 0 };
  private linking = false;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private parseService: ParseService
  ) { }

  ngOnInit() {
    this.userService.subscribe({}, ((users) => {
      this.users.splice(0, this.users.length);
      for (let key in users) {
        this.users.push({
          name: users[key].get('username'),
          ref: users[key]
        });
      }
    }).bind(this)).unsubscribe();
  }
  ngAfterContentInit() {
    if (this.job.user) {
      this.job.user.id = this.job.user.id || this.job.user.objectId;
      for (let user of this.users) {
        if (this.job.user.id === user.ref.id) {
          this.job.user = user.ref;
          break;
        }
      }
    }
  }

  async save() {
    try {
      this.job.ref.set('posX', this.job.x);
      this.job.ref.set('posY', this.job.y);
      this.job.ref.set('name', this.job.name);
      if (this.job.user && this.job.user.toPointer) {
        this.job.ref.set('user', this.job.user.toPointer());
      }
      await this.job.ref.save();
    } catch (e) {
      if (e.code === 119) {
        this.snackBar.open("您没有更新权限！", null, {
          duration: 2000,
          verticalPosition: 'top'
        });
      }
    }
  }
  async delete() {
    let dlg = this.dialog.open(ConformComponent, { width: '250px', data: this.job.name || '当前任务' });
    dlg.afterClosed().subscribe(async result => {
      if (result) {
        let res: { code: number } = await this.parseService.destroy(this.job.ref);
        if (res.code === 119) {
          this.snackBar.open("您没有删除权限！", null, {
            duration: 2000,
            verticalPosition: 'top'
          });
        }
      }
    });

  }
  async removeLink(next) {
    try {
      await this.job.ref.get('next').remove(next.ref);
      await next.ref.get('pre').remove(this.job.ref);
      await this.job.ref.save();
      await next.ref.save();
    } catch (e) {
      console.error(e);
    }
  }

  onMouseDown(evt: MouseEvent) {
    if (evt.button === 0 && evt.srcElement.className === 'mat-card-title') {
      this.moving = true;
      this.lastMousePosition = {
        x: evt.pageX,
        y: evt.pageY
      };
      evt.srcElement.setPointerCapture(1);
    }
  }
  onMouseUp(evt) {
    if (this.moving) {
      this.save();
    }
    this.moving = false;
  }
  onMouseMove(evt) {
    if (this.linking) {
      this.movelink.emit(evt);
    }
    if (this.moving) {
      this.job.x += (evt.pageX - this.lastMousePosition.x) / this.scale;
      this.job.y += (evt.pageY - this.lastMousePosition.y) / this.scale;
      this.job.x = Math.min(Math.max(50, this.job.x), 5000 - 50 - evt.srcElement.clientWidth);
      this.job.y = Math.min(Math.max(50, this.job.y), 5000 - 50 - evt.srcElement.clientHeight);
      this.lastMousePosition = {
        x: evt.pageX,
        y: evt.pageY
      };
    }
  }

  startLink(evt: MouseEvent, next = true) {
    if (evt.button === 0) {
      this.linking = true;
      evt.srcElement.setPointerCapture(1);
      this.startlink.emit({
        evt,
        job: this.job,
        next
      });
    }
  }

  endLink(evt: MouseEvent, next = true) {
    this.linking = false;
    if (evt.button === 0) {
      this.stoplink.emit({
        evt,
        job: this.job,
        next
      });
    }
  }

  setMarks() {
    if (this.project.toPointer) {
      let dlg = this.dialog.open(SetmarksComponent, { width: '650px', panelClass: 'panel-nopadding', data: { pProject: this.project.toPointer(), marks: this.job.marks } });
      dlg.afterClosed().subscribe(async result => {
        if (result) {
          this.job.ref.get('marks').add(result);
          for (let mark of this.job.marks) {
            let has = false;
            for (let m of result) {
              if (mark.id === m.id) {
                has = true;
                break;
              }
            }
            if (!has) {
              this.job.ref.get('marks').remove(mark);
            }
          }
          await this.job.ref.save();
        }
      });
    }
  }

  ngOnDestroy() {
  }
}
