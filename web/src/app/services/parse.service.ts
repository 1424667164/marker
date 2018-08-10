import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import * as Parse_ from 'parse';

const APP_ID = '123456';
const FILE_KEY = '123456';
const MASTER_KEY = '123456';

/*************
 *
 * 初始化 Parse
 *
 * ***********/
Parse_.initialize(APP_ID, MASTER_KEY, FILE_KEY);
Parse_.serverURL = 'http://172.16.1.209:1337/parse';
try {
  // let wallPost = new Parse_.Object("project");
  // let acl = new Parse_.ACL();
  // acl.setPublicReadAccess(true);
  // // acl.setRoleWriteAccess("Administrator", true);

  // let role = new Parse_.Role("Administrator", acl);
  // role.getUsers().add(Parse_.User.current());
  // role.save();
} catch (err) {
  console.error(err);
}
export const Parse = Parse_;

/*************
 *
 * ParseService
 *
 * ***********/
@Injectable({
  providedIn: 'root'
})
export class ParseService {

  constructor(private http: HttpClient) {

  }
  async deleteFile(url) {
    if (!url) {
      return false;
    }
    try {
      let res = await Parse.Cloud.run("deleteFile", {url});
      return res;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  async unzipFiles(url) {
    if (!url) {
      return false;
    }
    try {
      let res = await Parse.Cloud.run("unzipFiles", {url});
      return res;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

}

/*************
 *
 * ProjectService
 *
 * ***********/
const Project_ = Parse_.Object.extend('project');
@Injectable({
  providedIn: 'root'
})
export class ProjectService implements OnDestroy {
  private subject = new Subject<any>();
  private subscription = [];
  private querySubscription = null;
  public projects = {};

  constructor() {
    this.reset();
  }

  async reset() {
    try {
      this.ngOnDestroy();
      let query = new Parse_.Query(Project_);
      this.querySubscription = query.subscribe();
      this.querySubscription.on('open', async () => {
        try {
          let res = await query.find();
          for (let p of res) {
            this.projects[p.id] = p;
          }
          this.subject.next();
        } catch (e) {
          console.error(e);
        }
      });
      this.querySubscription.on('create', (object) => {
        this.projects[object.id] = object;
        this.subject.next();
      });
      this.querySubscription.on('update', (object) => {
        this.projects[object.id] = object;
        this.subject.next();
      });
      this.querySubscription.on('delete', (object) => {
        delete this.projects[object.id];
        this.subject.next();
      });
    } catch (e) {
      console.error(e);
    }
  }

  reload() {
    this.subject.next();
  }
  subscribe(cb) {
    this.subscription.push(this.subject.asObservable().subscribe(cb));
  }
  ngOnDestroy() {
    for (let sb of this.subscription) {
      sb.unsubscribe();
    }
    if (this.querySubscription && this.querySubscription.unsubscribe) {
      this.querySubscription.unsubscribe();
    }
  }
  async add(project_: any) {
    const project = new Project_();
    project.set('name', project_.name);
    project.set('root', project_.root);
    try {
      let res = await project.save();
      if (res._objCount === 1) {
        return true;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

export declare interface ParseObject {
  get?(attr: string);
  set?(attr: string, obj: any);
  has?(attr: string);
  addUnique?(attr: string, item: any);
  save?();
  remove?(attr: string, item: any);
}


