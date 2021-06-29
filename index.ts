interface ScratchCardConfig {
  canvas: HTMLCanvasElement; // canvas元素
  showAllPercent?: number; // 直接全部刮开百分比
  coverImg?: string; // 图片图层
  coverColor?: string; // 纯色图层
  doneCallback?: () => void; // 全部刮开回调函数
  radius?: number; //擦除半径
  pixelRatio: number; // 屏幕倍率, 适应retina屏
  fadeOut?: number; // 全部刮开淡出效果时间(ms)
}

class ScratchCard {
  config: ScratchCardConfig;
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  // offsetLeft/offsetTop为元素到最近定位父元素的距离, clientLeft/clientTop为元素左border/上border的长度
  offsetX: number;
  offsetY: number;
  done: boolean; // 是否完成 刮刮卡
  isDown: boolean; // 是否按下
  constructor(config: ScratchCardConfig) {
    this.config = {
      showAllPercent: 65,
      radius: 20,
      coverColor: '#999',
      fadeOut: 2000,
      ...config
    };
    this._init();
  }
  private _init() {
    this.canvas = this.config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.offsetX = this.canvas.offsetLeft;
    this.offsetY = this.canvas.offsetTop;
    this._addEvent();
    if (this.config.coverImg) {
      // 设置的是图片图层
      const coverImg = new Image();
      coverImg.src = this.config.coverImg;
      coverImg.onload = () => {
        this.ctx.drawImage(coverImg, 0, 0);
        // 源图像外显示目标图像, 源图像透明, 这里coverImg是目标图像,
        this.ctx.globalCompositeOperation = 'destination-out';
      };
    } else {
      // 纯色图层
      this.ctx.fillStyle = this.config.coverColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalCompositeOperation = 'destination-out';
    }
  }
  private _addEvent() {
    this.canvas.addEventListener('touchstart', this._eventDown.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this._eventUp.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this._scratch.bind(this), { passive: false });
    this.canvas.addEventListener('mousedown', this._eventDown.bind(this), { passive: false });
    this.canvas.addEventListener('mouseup', this._eventUp.bind(this), { passive: false });
    this.canvas.addEventListener('mousemove', this._scratch.bind(this), { passive: false });
  }
  private _eventDown(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    this.isDown = true;
  }
  private _eventUp(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    this.isDown = false;
  }
  // main function
  _scratch(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    let ev: MouseEvent | Touch = e as MouseEvent;
    if (!this.done && this.isDown) {
      if (e instanceof TouchEvent && e.changedTouches) {
        ev = e.changedTouches[e.changedTouches.length - 1];
      }
      // (ev.clientX + document.body.scrollLeft) || ev.pageX
      const x = (ev.clientX + document.body.scrollLeft || ev.pageX) - this.offsetX || 0;
      const y = (ev.clientY + document.body.scrollTop || ev.pageY) - this.offsetY || 0;
      // 不能通过下面解构赋值的方式使用context上下文的方法, 这样会丢失上下文, 可以通过with关键字, 但不推荐
      // const { beginPath, arc, fill } = this.ctx;
      this.ctx.beginPath();
      this.ctx.arc(
        x * this.config.pixelRatio,
        y * this.config.pixelRatio,
        this.config.radius * this.config.pixelRatio,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      // 判断刮百分比
      if (this._getFilledPercentage() > this.config.showAllPercent) {
        this._scratchAll();
      }
    }
  }
  _scratchAll() {
    this.done = true;
    if (this.config.fadeOut > 0) {
      this.canvas.style.transition = `all ${this.config.fadeOut}ms linear`;
      this.canvas.style.opacity = '0';
      setTimeout(() => {
        this._clear();
      }, this.config.fadeOut);
    } else {
      this._clear();
    }
    // 执行回调
    this.config?.doneCallback();
  }
  _clear() {
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  // 计算刮开区域百分比, 即计算画布透明区域百分比
  _getFilledPercentage() {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    // 点阵数组, 4个字节为一个像素, 每个字节分别代表rgba
    const pixels = imgData.data;
    let threshold = 0; // 这里可以设置阈值表示代表透明的分界线
    let transparentPixelCount = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] <= threshold) {
        transparentPixelCount++;
      }
    }
    return Number(((transparentPixelCount / (pixels.length / 4)) * 100).toFixed(2));
  }
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
new ScratchCard({
  canvas,
  coverImg: './scratch-2x.jpg',
  pixelRatio: 2,
  showAllPercent: 40,
  fadeOut: 400,
  doneCallback: () => {
    console.log('done');
  }
});
