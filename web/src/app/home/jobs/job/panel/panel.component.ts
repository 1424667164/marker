import { Component, OnInit, Input, AfterContentInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { UserService } from '../../../../services/parse/user.service';
import { Parse, ParseService } from '../../../../services/parse.service';

@Component({
  selector: 'job-panel-visual',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss']
})
export class PanelVisualComponent implements OnInit, AfterContentInit {
  @Input()
  job: any = {};
  @Input()
  scale = 1;
  @Input()
  project: any = {};

  private users = [];
  private get username() {
    return this.job.user && this.job.user.get && this.job.user.get('username');
  }
  private thisJob = {};

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private parseService: ParseService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.thisJob = this.route.snapshot.data.job;
  }
  async ngAfterContentInit() {
    if (this.job.user && this.job.user.get && !this.job.user.get('username')) {
      await this.job.user.fetch();
    }
    this.job.canCommit = true;
    for (let pre of this.job.pre) {
      if (pre.commit <= pre.rollback) {
        this.job.canCommit = false;
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

  async commit() {
    try {
      this.job.ref.increment('commit');
      this.job.ref.add('logs', `the ${this.job.commit+1}th commit by ${Parse.User.current().get('username')}`);
      this.job.ref.save();
    } catch (e) {
      console.error(e);
    }
  }
  async rollback() {
    try {
      this.job.ref.increment('rollback');
      this.job.ref.add('logs', `the ${this.job.rollback+1}th rollback by ${Parse.User.current().get('username')}`);
      this.job.ref.save();
    } catch (e) {
      console.error(e);
    }
  }
}
