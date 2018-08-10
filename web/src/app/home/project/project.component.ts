import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { ProjectService, Parse, ParseObject, ParseService } from '../../services/parse.service';
import { PublicService, Type } from '../../services/public.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit, AfterViewInit {
  private id = '';
  private newType = ''; // create type
  private newImage = null;  // upload image
  private newZip = null;  // upload zip
  private newImagePath = '';  // upload image name
  private newZipPath = '';  // upload zip name

  private resultString = ''; // result as string

  private currentType = 0;  // current selected mark type
  private project: ParseObject = {};  // current project
  private currentPreview = {};  // current preview image
  // filter image show
  private currentFilter_ = Type.FilterTypes.Normal;
  private get currentFilter() {
    return this.currentFilter_;
  }
  private set currentFilter(v) {
    if (this.ImageFilters[v].count < 1) {
      this.snackBar.open("没有符合条件的图片", null, {
        duration: 1200,
        verticalPosition: 'top',
        panelClass: 'snack-bar'
      });
      return;
    }
    this.currentFilter_ = v;
    this.currentImageIndex--;
    this.next({});
  }
  private ImageFilters = [
    { type: Type.FilterTypes.Normal, name: '未废弃', count: 0 },
    { type: Type.FilterTypes.Pure, name: '未处理', count: 0 },
    { type: Type.FilterTypes.UnMarked, name: '未标注', count: 0 },
    { type: Type.FilterTypes.Marked, name: '已标注', count: 0 },
    { type: Type.FilterTypes.Hided, name: '已废弃', count: 0 },
    { type: Type.FilterTypes.All, name: '全部', count: 0 }
  ];

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
  private ctx: CanvasRenderingContext2D = null;

  private get name() {
    return this.project.get && this.project.get('name');
  }
  private get types() {
    return this.project.get && this.project.get('types') || [];
  }
  private get images() {
    return this.project.get && this.project.get('images') || [];
  }

  private currentImageIndex = -1;  // current image url
  private get currentImage() {
    return (this.images && this.images[this.currentImageIndex]) || {};
  }

  private showAll_ = false; // if show all images
  private get showAll() {
    return this.showAll_;
  }
  private set showAll(val) {
    this.showAll_ = val;
    if (!val && this.currentImage.hide) {
      this.next({});
    }
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
      for (let img of this.images) {
        if (img.hide) {
          this.ImageFilters[Type.FilterTypes.Hided].count++;
        } else {
          this.ImageFilters[Type.FilterTypes.Normal].count++;
        }
        if (img.marks) {
          this.ImageFilters[Type.FilterTypes.Marked].count++;
        } else {
          this.ImageFilters[Type.FilterTypes.UnMarked].count++;
        }
        if (!img.hide && !img.marks) {
          this.ImageFilters[Type.FilterTypes.Pure].count++;
        }
        this.ImageFilters[Type.FilterTypes.All].count++;
      }
    }).bind(this));
    this.projectService.reload();
    setTimeout(async () => {
      this.currentImageIndex = this.project.get('current') || 0;
      this.currentImageIndex -= 1;
      this.next({});
      // for (let img of this.images) {
      //   if (!img.marks) {
      //     continue;
      //   }
      //   for (let m of img.marks) {
      //     m.label = this.currentType;
      //   }
      // }
      // await this.project.save();
    }, 300);
  }
  ngAfterViewInit() {
    let overlay: HTMLDivElement = document.querySelector('#overlay');
    if (overlay) {
      this.bboxs.width = overlay.clientWidth;
      this.bboxs.height = overlay.clientHeight;
    }
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

  checkIndex() {
    switch (this.currentFilter) {
      case Type.FilterTypes.Pure:
        return !this.currentImage.hide && !this.currentImage.marks;
      case Type.FilterTypes.Hided:
        return this.currentImage.hide;
      case Type.FilterTypes.Marked:
        return this.currentImage.marks;
      case Type.FilterTypes.UnMarked:
        return !this.currentImage.marks;
      case Type.FilterTypes.Normal:
        return !this.currentImage.hide;
      default:
        return true;
    }
  }
  pre(evt) {
    this.bboxs.all = [];
    let lastIndex = this.currentImageIndex;
    this.currentImageIndex = Math.max(0, this.currentImageIndex - 1);
    if (evt.shiftKey) {
      this.currentImageIndex = 1;
      return this.pre({});
    }
    if (lastIndex !== this.currentImageIndex && !this.checkIndex()) {
      this.pre(evt);
      if (this.currentImageIndex === 0 && !this.checkIndex()) {
        return this.next(evt);
      }
    }
    // if (!this.showAll && this.currentImage.hide && lastIndex !== this.currentImageIndex) {
    //   this.pre(evt);
    //   if (this.currentImageIndex === 0 && this.currentImage.hide) {
    //     return this.next(evt);
    //   }
    // }
    this.prepareBox();
    if (lastIndex === this.currentImageIndex) {
      this.snackBar.open("前面没有了", null, {
        duration: 2000,
        verticalPosition: 'top'
      });
    }
  }
  next(evt) {
    this.bboxs.all = [];
    let lastIndex = this.currentImageIndex;
    this.currentImageIndex = Math.min(this.images.length - 1, this.currentImageIndex + 1);
    if (evt.shiftKey) {
      this.currentImageIndex = this.images.length - 2;
      return this.next({});
    }
    if (lastIndex !== this.currentImageIndex && !this.checkIndex()) {
      this.next(evt);
      if (this.currentImageIndex === this.images.length - 1 && !this.checkIndex()) {
        return this.pre(evt);
      }
    }
    // if (!this.showAll && this.currentImage.hide && lastIndex !== this.currentImageIndex) {
    //   this.next(evt);
    //   if (this.currentImageIndex === this.images.length - 1 && this.currentImage.hide) {
    //     return this.pre(evt);
    //   }
    // }
    this.prepareBox();
    if (lastIndex === this.currentImageIndex) {
      this.snackBar.open("后面没有了", null, {
        duration: 1200,
        verticalPosition: 'top',
        panelClass: 'snack-bar'
      });
    }
  }
  async mark() {
    try {
      if (!this.currentImage.marks) {
        this.currentImage.marks = [];
      }
      for (let rect of this.bboxs.all) {
        let x = (rect.p1.x + rect.p2.x) / 2;
        let y = (rect.p1.y + rect.p2.y) / 2;
        let w = Math.abs(rect.p1.x - rect.p2.x);
        let h = Math.abs(rect.p1.y - rect.p2.y);
        this.currentImage.marks.push({
          x: x / this.bboxs.width,
          y: y / this.bboxs.height,
          w: w / this.bboxs.width,
          h: h / this.bboxs.height,
          t: 0,
          label: this.currentType
        });
      }
      this.project.set('current', this.currentImageIndex);
      await this.project.save();
      this.bboxs.all = [];
      this.next({});
    } catch (e) {
      console.error(e);
    }
  }
  async hide() {
    if (!this.currentImage) {
      return;
    }
    try {
      this.currentImage.hide = !this.currentImage.hide;
      this.project.set('current', this.currentImageIndex);
      await this.project.save();
      this.next({});
    } catch (e) {
      console.error(e);
    }
  }
  async removeMark(style) {
    try {
      if (style.tmp) {
        this.bboxs.all['splice'](this.bboxs.all.indexOf(style.rect), 1);
        this.prepareBox();
      } else {
        this.currentImage.marks.splice(this.currentImage.marks.indexOf(style.rect), 1);
        await this.project.save();
      }
    } catch (e) {
      console.error(e);
    }
  }

  generateResult() {
    this.resultString = '';
    this.resultString += '以下为类型信息:\n\n';
    for (let type of this.types) {
      this.resultString += type;
    }

    this.resultString += '\n\n以下为标签信息:\n\n';
    for (let img of this.images) {
      if (!img.marks || !img.marks.length) {
        continue;
      }
      this.resultString += img.url + ' ';
      for (let mark of img.marks) {
        this.resultString += `${mark.label},${mark.x},${mark.y},${mark.w},${mark.h},${mark.t} `;
      }
      this.resultString += '\n';
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
    if (this.currentImage.marks) {
      for (let rect of this.currentImage.marks) {
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
