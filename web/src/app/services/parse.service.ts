import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
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

  async checkAdmin() {
    let query = new Parse.Query(Parse.Role);
    query.equalTo('name', 'admin');
    let adminRole = await query.first();
    if (adminRole) {
      let users = adminRole.getUsers().query();
      let name = Parse.User.current().getUsername();
      let u = await users.contains('username', name).first();
      return !!u;
    }
  }

  async add(obj) {
    try {
      let ok: any = await new Promise((res, rej) => {
        obj.save()
          .then(res_ => {
            res(res_);
          })
          .catch(err => {
            rej(err);
          })
      });
      if (ok._objCount > 0) {
        return ok;
      } else {
        return { code: 119 };
      }
    } catch (err) {
      return err;
    }
  }

  async destroy(obj) {
    try {
      let ok = await new Promise((res, rej) => {
        obj.destroy()
          .then((res_) => {
            res(res_);
          })
          .catch(err => {
            rej(err);
          });
      });
      return ok;
    } catch (e) {
      return e;
    }
  }

  async deleteFile(url) {
    if (!url) {
      return false;
    }
    try {
      let res = await Parse.Cloud.run("deleteFile", { url });
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
      let res = await Parse.Cloud.run("unzipFiles", { url });
      return res;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

}

export declare class ParseObject {
  id?: string;
  get?(attr: string);
  set?(attr: string, obj: any);
  has?(attr: string);
  addUnique?(attr: string, item: any);
  save?();
  remove?(attr: string, item: any);
  toPointer?();
  fetch?();
}


/*************
 *
 * ParseClass
 *
 * ***********/
export abstract class ParseClass2 implements OnDestroy {
  // protected subject = new Subject<any>();
  private subjects = {};
  protected subscription = [];
  // protected querySubscription = null;
  private querySubscription = {};
  public objects = {};
  private className = '';
  private router_: Router = null;

  constructor(cn,
    r: Router
  ) {
    this.className = cn;
    this.router_ = r;
  }

  async reset(where = {}) {
    try {
      // this.ngOnDestroy();
      let whereString = JSON.stringify(where);
      if (this.querySubscription[whereString]) {
        this.querySubscription[whereString].unsubscribe();
      }
      let query = new Parse.Query(this.className);
      for (let key in where) {
        query.equalTo(key, where[key]);
      }
      this.querySubscription[whereString] = query.subscribe();
      let reFill = async () => {
        try {
          let res = await query.find();
          for (let p of res) {
            this.objects[p.id] = p;
          }
          this.subjects[whereString].next();
        } catch (e) {
          if (e.code === 209) {
            await Parse.User.logOut();
            this.router_.navigate(['/user/signin']);
          }
          console.error(e);
        }
      }
      this.querySubscription[whereString].on('open', async () => {
        await reFill();
      });
      this.querySubscription[whereString].on('create', (object) => {
        this.objects[object.id] = object;
        this.subjects[whereString].next(object);
      });
      this.querySubscription[whereString].on('update', (object) => {
        this.objects[object.id] = object;
        this.subjects[whereString].next(object);
      });
      this.querySubscription[whereString].on('delete', (object) => {
        delete this.objects[object.id];
        setTimeout(async () => {
          await reFill();
        }, 200);
      });
    } catch (e) {
      console.error(e);
    }
  }

  reload(whereString = '{}') {
    this.subjects[whereString] && this.subjects[whereString].next();
  }
  subscribe(where = {}, cb = null) {
    if (!cb) {
      return '';
    }
    let whereString = JSON.stringify(where);
    if (!this.subjects[whereString]) {
      this.subjects[whereString] = new Subject<any>();
      this.reset(where);
    }
    this.subscription.push(this.subjects[whereString].asObservable().subscribe(cb));
    return whereString;
  }
  ngOnDestroy() {
    for (let sb of this.subscription) {
      sb.unsubscribe();
    }
    for (let key in this.querySubscription) {
      this.querySubscription[key].unsubscribe();
    }
  }
}


/*************
 *
 * ParseClass
 *
 * ***********/
interface SubjectObject {
  [n: string]: Subject<any>;
}
export abstract class ParseClass implements OnDestroy {
  private subjects: SubjectObject = {};
  protected subscription = {};
  private querySubscription = {};
  protected objects = {};
  private className = '';
  private router_: Router = null;

  constructor(cn,
    r: Router
  ) {
    this.className = cn;
    this.router_ = r;
  }

  async reset(where = {}) {
    let whereString = JSON.stringify(where);
    try {
      for (let sb of this.subscription[whereString] || []) {
        sb.unsubscribe();
      }
      if (this.querySubscription[whereString]) {
        this.querySubscription[whereString].unsubscribe();
      }
      let query = new Parse.Query(this.className);
      for (let key in where) {
        query.equalTo(key, where[key]);
      }
      this.querySubscription[whereString] = query.subscribe();
      let reFill = async () => {
        this.objects[whereString] = {};
        try {
          let res = await query.find();
          for (let p of res) {
            this.objects[whereString][p.id] = p;
          }
          this.subjects[whereString].next(this.objects[whereString]);
        } catch (e) {
          if (e.code === 209) {
            await Parse.User.logOut();
            this.router_.navigate(['/user/signin']);
          }
          console.error(e);
        }
      }
      this.querySubscription[whereString].on('create', (object) => {
        this.objects[whereString][object.id] = object;
        this.subjects[whereString].next(this.objects[whereString]);
      });
      this.querySubscription[whereString].on('update', (object) => {
        this.objects[whereString][object.id] = object;
        this.subjects[whereString].next(this.objects[whereString]);
      });
      this.querySubscription[whereString].on('delete', async (object) => {
        delete this.objects[whereString][object.id];
        let query = new Parse.Query(this.className);
        for (let key in where) {
          query.equalTo(key, where[key]);
        }
        query.equalTo('id', object.id);
        let obj = await query.first()
        this.objects[whereString][object.id] = obj;
        this.subjects[whereString].next(this.objects[whereString]);
        // setTimeout(async () => {
        //   await reFill();
        // }, 200);
      });
      await reFill();
    } catch (e) {
      console.error(e);
    }
  }

  reload(whereString = '{}') {
    this.subjects[whereString] && this.subjects[whereString].next(this.objects[whereString]);
  }
  subscribe(where = {}, cb = null) {
    if (!cb) {
      return '';
    }
    let whereString = JSON.stringify(where);
    if (!this.subjects[whereString]) {
      this.subjects[whereString] = new Subject<any>();
      this.reset(where);
    }
    this.subscription[whereString] = this.subscription[whereString] || [];
    this.subscription[whereString].push(this.subjects[whereString].asObservable().subscribe(cb));
    return whereString;
  }

  ngOnDestroy() {
    for (let key in this.subscription) {
      for (let sb of this.subscription[key]) {
        sb.unsubscribe();
      }
    }
    for (let key in this.querySubscription) {
      this.querySubscription[key].unsubscribe();
    }
  }
}
