import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, _MatListItemMixinBase, } from '@angular/material';
import { ImageService } from '../../../services/parse/image.service';
import { MarkService, Mark } from '../../../services/parse/mark.service';

@Component({
  selector: 'app-setmarks_',
  templateUrl: './setmarks.component.html',
  styleUrls: ['./setmarks.component.css']
})
export class SetmarksComponent implements OnInit {
  private images = [];
  private lastIndex = 0;

  constructor(
    private imageService: ImageService,
    public dialogRef: MatDialogRef<SetmarksComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pProject: any, marks: any[]}
  ) { }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  ngOnInit() {
    let imgSubString = this.imageService.subscribe({ project: this.data.pProject }, (() => {
      let images_ = this.imageService.images || {};
      this.images.splice(0, this.images.length);
      for (let key in images_) {
        let img = {
          id: images_[key].id,
          url: images_[key].get('url'),
          markedd: false,
          ref: images_[key]
        };
        for(let mark of this.data.marks) {
          if(mark.get('image').id === img.id){
            img.markedd = true;
            break;
          }
        }
        this.images.push(img);
      }
    }).bind(this));
    this.imageService.reload(imgSubString);
  }

  selectChanged(evt) {
    if (window.event['shiftKey']) {
      for (let i = Math.min(this.lastIndex, evt.option.value); i < Math.max(this.lastIndex, evt.option.value); i++) {
        evt.option.selectionList.options._results[i].selected = true;
      }
    }
    this.lastIndex = evt.option.value;
  }
  async createMarks(selectedList) {
    let marks = [];
    for (let item of selectedList) {
      let mark = new Mark();
      mark.set('image', this.images[item.value].ref.toPointer());
      await mark.save();
      marks.push(mark);
    }
    this.dialogRef.close(marks);
  }
}
