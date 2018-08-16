import { Directive, EventEmitter, Input, Output, ElementRef, AfterViewInit, AfterContentInit } from '@angular/core';

@Directive({
  selector: '[appLink]'
})
export class LinkDirective implements AfterViewInit {
  private viewport_ = { x: 0, y: 0, w: 5000, h: 5000 };
  @Input()
  set viewport(v) {
    if (v.x > this.viewport_.x - this.viewport_.w / 2 &&
      v.x + v.w < this.viewport_.x + 3 * this.viewport_.w / 2 &&
      v.y > this.viewport_.y - this.viewport_.h / 2 &&
      v.y + v.h < this.viewport_.y + 3 * this.viewport_.h / 2) {
    } else {
      this.viewport_ = v;
    }
  }
  get viewport() {
    return this.viewport_;
  }

  @Input()
  scale = 1;
  jobs_ = [];
  @Input()
  set jobs(newJobs) {
    this.jobs_ = newJobs;
  }
  get jobs() {
    return this.jobs_;
  }

  private currentLink = {
    p1: {
      x: -100,
      y: -100
    },
    p2: {
      x: -100,
      y: -100
    },
    rp2: {
      x: -100,
      y: -100
    },
    last: {
      x: 0,
      y: 0
    },
    nextJob: null
  };
  private linkingJob = null;
  private linkFromPre: boolean = true;

  private ctx: CanvasRenderingContext2D = null;

  constructor(private ele: ElementRef) { }

  ngAfterViewInit() {
    let root = this.ele.nativeElement as HTMLDivElement;
    let canvas = document.createElement('canvas');
    canvas.width = root.clientWidth;
    canvas.height = root.clientHeight;
    root.insertBefore(canvas, root.firstChild);
    this.ctx = canvas.getContext('2d');

    let that = this;
    function redraw() {
      that.draw(true);
      that.initLink();
      that.drawCurrent();
      window.requestAnimationFrame(redraw);
    }
    window.requestAnimationFrame(redraw);
  }

  initLink() {
    for (let job of this.jobs) {
      for (let n of job.next) {
        this.drawLink(
          { x: job.x + 245, y: job.y + 52 },
          { x: n.x - 5, y: n.y + 52 }
        );
      }
    }
  }

  start({ evt, job, next }) {
    if (next) {
      this.currentLink.p1.x = job.x + 245;
      this.currentLink.p1.y = job.y + 52;
      this.currentLink.p2.x = job.x + 245;
      this.currentLink.p2.y = job.y + 52;
    } else {
      this.currentLink.p1.x = job.x - 5;
      this.currentLink.p1.y = job.y + 52;
      this.currentLink.p2.x = job.x - 5;
      this.currentLink.p2.y = job.y + 52;
    }
    this.currentLink.rp2 = this.currentLink.p2;
    this.currentLink.last.x = evt.layerX;
    this.currentLink.last.y = evt.layerY;
    this.currentLink.nextJob = null;
    this.linkingJob = job;
    this.linkFromPre = next;
  }

  move(evt) {
    this.currentLink.p2.x += (evt.layerX - this.currentLink.last.x) / this.scale;
    this.currentLink.p2.y += (evt.layerY - this.currentLink.last.y) / this.scale;
    this.currentLink.rp2 = this.caclNext(this.currentLink.p2.x, this.currentLink.p2.y);
    this.currentLink.last.x = evt.layerX;
    this.currentLink.last.y = evt.layerY;
    // this.draw().drawCurrent(this.currentLink.p1, nextPoint);
  }

  async stop({ evt, job, next }) {
    this.currentLink.p1 = { x: -100, y: -100 };
    this.currentLink.p2 = { x: -100, y: -100 };
    this.currentLink.rp2 = { x: -100, y: -100 };
    if (this.currentLink.nextJob) {
      if (this.linkFromPre) {
        for(let job of this.currentLink.nextJob.next) {
          if(job.ref.id === this.linkingJob.ref.id) {
            // re link
            console.log('re link');
            return;
          }
        }
        this.linkingJob.ref.get('next').add(this.currentLink.nextJob.ref);
        this.currentLink.nextJob.ref.get('pre').add(this.linkingJob.ref);
      } else if (!this.linkFromPre && this.currentLink.nextJob.ref) {
        for(let job of this.linkingJob.next) {
          if(job.ref.id === this.currentLink.nextJob.ref.id) {
            // re link
            console.log('re link');
            return;
          }
        }
        this.linkingJob.ref.get('pre').add(this.currentLink.nextJob.ref);
        this.currentLink.nextJob.ref.get('next').add(this.linkingJob.ref);
      }
      try {
        await this.linkingJob.ref.save();
        await this.currentLink.nextJob.ref.save();
      } catch (e) {
        console.error(e);
      }
    }
  }

  caclNext(x, y) {
    this.currentLink.nextJob = null;
    for (let job of this.jobs_) {
      if (x > job.x - 10
        && x < job.x + 250
        && y > job.y + 26
        && y < job.y + 74
        && job !== this.linkingJob) {
        this.drawDebug(job.x - 10, job.y + 26, 260, 48);
        this.currentLink.nextJob = job;
        return this.linkFromPre ? {
          x: job.x - 5,
          y: job.y + 52
        } : {
            x: job.x + 245,
            y: job.y + 52
          }
      }
    }
    return this.currentLink.p2;
  }

  drawDebug(x, y, w, h) {
    this.ctx.clearRect(x, y, w, h);
    this.ctx.strokeStyle = "#0AA";
    this.ctx.rect(x, y, w, h);
    // this.ctx.strokeRect(x, y, w, h);
    this.ctx.stroke();
    return this;
  }

  drawCurrent() {
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = "#F00";
    this.ctx.beginPath();
    this.ctx.moveTo(this.currentLink.p1.x, this.currentLink.p1.y);
    this.ctx.bezierCurveTo(this.currentLink.p1.x + (~~this.linkFromPre - 0.5) * 250, this.currentLink.p1.y,
      this.currentLink.rp2.x + (~~this.linkFromPre - 0.5) * -250, this.currentLink.rp2.y,
      this.currentLink.rp2.x, this.currentLink.rp2.y);
    // this.ctx.lineTo(this.currentLink.rp2.x, this.currentLink.rp2.y);
    this.ctx.stroke();

    return this;
  }

  drawLink(p1, p2) {
    if (p1.x < this.viewport_.x - this.viewport_.w / 2 &&
      p1.x > this.viewport_.x + 3 * this.viewport_.w / 2 &&
      p1.y < this.viewport_.y - this.viewport_.h / 2 &&
      p1.y > this.viewport_.y + 3 * this.viewport_.h / 2 &&
      p2.x < this.viewport_.x - this.viewport_.w / 2 &&
      p2.x > this.viewport_.x + 3 * this.viewport_.w / 2 &&
      p2.y < this.viewport_.y - this.viewport_.h / 2 &&
      p2.y > this.viewport_.y + 3 * this.viewport_.h / 2) {
      return;
    }

    const arrowLength = 20;
    let center = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    }
    let angle = Math.atan2((p1.y - p2.y)/2, (p1.x - p2.x + 125)/2);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = 2 / this.scale;
    this.ctx.strokeStyle = "#4F0";
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.bezierCurveTo(
      p1.x + 125, p1.y,
      p2.x - 125, p2.y,
      p2.x, p2.y);
    this.ctx.moveTo(center.x, center.y);
    this.ctx.lineTo(center.x + arrowLength * Math.cos(angle + Math.PI / 6), center.y + arrowLength * Math.sin(angle + Math.PI / 6));
    this.ctx.moveTo(center.x, center.y);
    this.ctx.lineTo(center.x + arrowLength * Math.cos(angle - Math.PI / 6), center.y + arrowLength * Math.sin(angle - Math.PI / 6));
    this.ctx.stroke();
    this.ctx.restore();

    return this;
  }

  draw(full = false) {
    if (full && this.ctx) {
      let dx = this.viewport.w / 2;
      let dy = this.viewport.h / 2;
      this.ctx.clearRect(this.viewport.x - dx, this.viewport.y - dy, this.viewport.w + 2 * dx, this.viewport.h + 2 * dy);
    }

    return this;
  }
}
