import { Component, OnInit, AfterContentInit } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { Parse, ParseObject, ParseService } from '../../../services/parse.service';
import { ProjectService } from '../../../services/parse/project.service';
import { ImageService, Image } from '../../../services/parse/image.service';
import { UserService } from '../../../services/parse/user.service';
import { ConformComponent } from '../../dialog/conform/conform.component'
import { CustomErrorStateMatcher } from '../../../services/public.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements AfterContentInit {
  private id = '';
  private newImage = null;  // upload image
  private newZip = null;  // upload zip
  private newImagePath = '';  // upload image name
  private newZipPath = '';  // upload zip name

  private project: ParseObject = {};  // current project
  private images = [];
  private currentPreview = {};  // current preview image

  private get name() {
    return this.project && this.project.get && this.project.get('name');
  }
  private get types() {
    return this.project && this.project.get && this.project.get('types') || [];
  }

  private listImageObserver: Observer<any[]> = null;
  private get listedImages() {
    return new Observable<any[]>((observer: Observer<any[]>) => {
      let listImages = [];
      for (let i = this.currentImageSlice; i < Math.min(this.currentImageSlice + 20, this.images.length); i++) {
        listImages.push(this.images[i]);
      }
      observer.next(listImages);
      this.listImageObserver = observer;
    });
  }
  private currentImageSlice = 0;  // current images slice position
  private set currentImageSliceChange(v) {
    this.currentImageSlice += v;
    this.currentImageSlice = Math.min(Math.max(this.currentImageSlice, 0), this.images.length - 19);
    if (this.listImageObserver) {
      this.listImageObserver.next([]);
    }
  }
  private typeFormControl = null;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private imageService: ImageService,
    private parseService: ParseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private matcher: CustomErrorStateMatcher,
    private userService: UserService
  ) {
    this.typeFormControl = matcher.formControl(true);
  }

  ngAfterContentInit() {
    this.id = this.route.parent.snapshot.paramMap.get('id');
    // this.projectService.subscribe({}, (() => {
    //   this.project = this.projectService.projects[this.id] || {};

    // }).bind(this));
    // this.projectService.reload();
    this.project = this.route.snapshot.data.project;
console.log(this.route);
    if (this.project && this.project.toPointer) {console.log(11);
      let imgSubString = this.imageService.subscribe({ project: this.project.toPointer() }, ((images_) => {
        this.images.splice(0, this.images.length);
        for (let key in images_) {
          this.images.push({
            id: images_[key].id,
            url: images_[key].get('url'),
            width: images_[key].get('width'),
            height: images_[key].get('height'),
            marks: images_[key].get('marks'),
            ref: images_[key]
          })
        }
      }).bind(this));
      this.imageService.reload(imgSubString);
    }
  }

  async addType() {
    try {
      if (!this.project.has('types')) {
        this.project.set('types', []);
      }
      this.project.addUnique('types', this.typeFormControl.value);
      await this.project.save();
      this.typeFormControl.reset();
    } catch (e) {
      if (e.code === 119) {
        this.snackBar.open("您没有足够的权限！", null, {
          duration: 2000,
          verticalPosition: 'top'
        });
        this.project.fetch();
      }
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

  onFileChange(files) {
    if (files && files[0]) {
      // this.newImage = files[0];
      let fr = new FileReader();
      fr.readAsDataURL(files[0]);
      fr.onloadend = () => {
        this.newImage = fr.result;
      };
    }
  }
  onFileChangeZip(files) {
    if (files && files[0]) {
      let fr = new FileReader();
      fr.readAsDataURL(files[0]);
      fr.onloadend = () => {
        this.newZip = fr.result;
      };
    }
  }
  async addImage() {
    if (!this.newImage) {
      return;
    }
    try {
      if (!this.newImage) {
        return;
      }
      let ext = this.newImage.substr(this.newImage.indexOf('/') + 1, 3);
      let name = '' + Math.round(Math.random() * 10000000000) + '.' + ext;
      let parseFile = new Parse.File(name, { base64: this.newImage }, 'image/' + ext);
      await parseFile.save();
      let url = parseFile.url();
      let id = url.substr(url.lastIndexOf('/') + 1);
      id = id.substr(0, id.lastIndexOf('.'));
      id += Math.round(Math.random() * 1000000);
      let image = new Image();
      image.set('url', url);
      image.set('marks', 0);
      image.set('width', 0);
      image.set('height', 0);
      image.set('user', Parse.User.current().toPointer());
      image.set('project', this.project.toPointer());
      let res = await this.parseService.add(image);
      if (res.code === 119) {
        this.snackBar.open("您没有添加图片的权限！", null, {
          duration: 2000,
          verticalPosition: 'top'
        });
      } else {
        this.newImage = null;
        this.newImagePath = '';
      }
    } catch (e) {
      console.error(e);
    }
  }
  async addImages() {
    if (!this.newZip) {
      return;
    }
    try {
      let name = '' + Math.round(Math.random() * 10000000000) + '.zip';
      let parseFile = new Parse.File(name, { base64: this.newZip }, 'application/zip');
      parseFile = await parseFile.save();
      let zipUrl: String = parseFile.url();
      let res = await this.parseService.unzipFiles(zipUrl);
      if (res && res.length > 0 && res.forEach) {
        let baseUrl = zipUrl.substr(0, zipUrl.lastIndexOf('/') + 1);
        for (let file of res) {
          if (/[a-zA-Z0-9_-]+\.(png|jpg|jpeg)/.test(file)) {
            let url = baseUrl + file;
            // let id = url.substr(url.lastIndexOf('/') + 1);
            // id = id.substr(0, id.lastIndexOf('.'));
            // id += Math.round(Math.random() * 1000000);

            let image = new Image();
            image.set('url', url);
            image.set('marks', 0);
            image.set('width', 0);
            image.set('height', 0);
            image.set('user', Parse.User.current().toPointer());
            image.set('project', this.project.toPointer());
            let res = await this.parseService.add(image);
            // this.project.addUnique('images', {
            //   id,
            //   url,
            //   hide: false
            // });
          }
        }
      }
      this.newZip = null;
      this.newZipPath = '';
    } catch (e) {
      console.error(e);
    }
  }
  async removeImage(image) {
    try {
      let dlg = this.dialog.open(ConformComponent, { width: '250px', data: image.id });
      dlg.afterClosed().subscribe(async result => {
        if (result) {
          let res: { code: number } = await this.parseService.destroy(image.ref);
          if (res.code === 119) {
            this.snackBar.open("您没有删除权限！", null, {
              duration: 2000,
              verticalPosition: 'top'
            });
          } else {
            await this.parseService.deleteFile(image.url);
            this.currentPreview = {};
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
}

