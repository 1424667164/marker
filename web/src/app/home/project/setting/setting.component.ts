import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { ProjectService, Parse, ParseObject, ParseService } from '../../../services/parse.service';
import { PublicService, Type } from '../../../services/public.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {
  private id = '';
  private newType = ''; // create type
  private newImage = null;  // upload image
  private newZip = null;  // upload zip
  private newImagePath = '';  // upload image name
  private newZipPath = '';  // upload zip name

  private project: ParseObject = {};  // current project
  private currentPreview = {};  // current preview image

  private get name() {
    return this.project.get && this.project.get('name');
  }
  private get types() {
    return this.project.get && this.project.get('types') || [];
  }
  private get images() {
    return this.project.get && this.project.get('images') || [];
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

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private publicService: PublicService,
    private parseService: ParseService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');

    this.projectService.subscribe((() => {
      this.project = this.projectService.projects[this.id] || {};
      this.publicService.setTitle(this.name);
    }).bind(this));
    this.projectService.reload();
  }

  async addType() {
    try {
      if (!this.project.has('types')) {
        this.project.set('types', []);
      }
      this.project.addUnique('types', this.newType);
      await this.project.save();
      this.newType = '';
    } catch (e) {
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
      if (!this.project.has('images')) {
        this.project.set('images', []);
      }
      let name = '' + Math.round(Math.random() * 10000000000) + '.jpg';
      let parseFile = new Parse.File(name, { base64: this.newImage }, 'image/jpeg');
      await parseFile.save();
      let url = parseFile.url();
      let id = url.substr(url.lastIndexOf('/') + 1);
      id = id.substr(0, id.lastIndexOf('.'));
      id += Math.round(Math.random() * 1000000);
      this.project.addUnique('images', {
        id,
        url,
        hide: false
      });
      await this.project.save();
      this.newImage = null;
      this.newImagePath = '';
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
      let res = await parseFile.save();
      let zipUrl: String = parseFile.url();
      res = await this.parseService.unzipFiles(zipUrl);
      if (res && res.length > 0 && res.forEach) {
        let baseUrl = zipUrl.substr(0, zipUrl.lastIndexOf('/') + 1);
        for (let file of res) {
          if (/[a-zA-Z0-9_-]+\.(png|jpg|jpeg)/.test(file)) {
            let url = baseUrl + file;
            let id = url.substr(url.lastIndexOf('/') + 1);
            id = id.substr(0, id.lastIndexOf('.'));
            id += Math.round(Math.random() * 1000000);
            this.project.addUnique('images', {
              id,
              url,
              hide: false
            });
          }
        }
        await this.project.save();
      }
      this.newZip = null;
      this.newZipPath = '';
    } catch (e) {
      console.error(e);
    }
  }
  async removeImage(image) {
    try {
      if (this.parseService.deleteFile(image)) {
        this.project.remove('images', image);
        await this.project.save();
      }
    } catch (e) {
      console.error(e);
    }
  }
}

