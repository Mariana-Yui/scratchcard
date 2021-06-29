var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var ScratchCard = /** @class */ (function () {
    function ScratchCard(config) {
        this.config = __assign({ showAllPercent: 65, radius: 20, coverColor: '#999', fadeOut: 2000 }, config);
        this._init();
    }
    ScratchCard.prototype._init = function () {
        var _this = this;
        this.canvas = this.config.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.offsetX = this.canvas.offsetLeft;
        this.offsetY = this.canvas.offsetTop;
        this._addEvent();
        if (this.config.coverImg) {
            // 设置的是图片图层
            var coverImg_1 = new Image();
            coverImg_1.src = this.config.coverImg;
            coverImg_1.onload = function () {
                _this.ctx.drawImage(coverImg_1, 0, 0);
                // 源图像外显示目标图像, 源图像透明, 这里coverImg是目标图像,
                _this.ctx.globalCompositeOperation = 'destination-out';
            };
        }
        else {
            // 纯色图层
            this.ctx.fillStyle = this.config.coverColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalCompositeOperation = 'destination-out';
        }
    };
    ScratchCard.prototype._addEvent = function () {
        this.canvas.addEventListener('touchstart', this._eventDown.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this._eventUp.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this._scratch.bind(this), { passive: false });
        this.canvas.addEventListener('mousedown', this._eventDown.bind(this), { passive: false });
        this.canvas.addEventListener('mouseup', this._eventUp.bind(this), { passive: false });
        this.canvas.addEventListener('mousemove', this._scratch.bind(this), { passive: false });
    };
    ScratchCard.prototype._eventDown = function (e) {
        e.preventDefault();
        this.isDown = true;
    };
    ScratchCard.prototype._eventUp = function (e) {
        e.preventDefault();
        this.isDown = false;
    };
    // main function
    ScratchCard.prototype._scratch = function (e) {
        e.preventDefault();
        var ev = e;
        if (!this.done && this.isDown) {
            if (e instanceof TouchEvent && e.changedTouches) {
                ev = e.changedTouches[e.changedTouches.length - 1];
            }
            // (ev.clientX + document.body.scrollLeft) || ev.pageX
            var x = (ev.clientX + document.body.scrollLeft || ev.pageX) - this.offsetX || 0;
            var y = (ev.clientY + document.body.scrollTop || ev.pageY) - this.offsetY || 0;
            // 不能通过下面解构赋值的方式使用context上下文的方法, 这样会丢失上下文, 可以通过with关键字, 但不推荐
            // const { beginPath, arc, fill } = this.ctx;
            this.ctx.beginPath();
            this.ctx.arc(x * this.config.pixelRatio, y * this.config.pixelRatio, this.config.radius * this.config.pixelRatio, 0, Math.PI * 2);
            this.ctx.fill();
            // 判断刮百分比
            if (this._getFilledPercentage() > this.config.showAllPercent) {
                this._scratchAll();
            }
        }
    };
    ScratchCard.prototype._scratchAll = function () {
        var _this = this;
        var _a;
        this.done = true;
        if (this.config.fadeOut > 0) {
            this.canvas.style.transition = "all " + this.config.fadeOut + "ms linear";
            this.canvas.style.opacity = '0';
            setTimeout(function () {
                _this._clear();
            }, this.config.fadeOut);
        }
        else {
            this._clear();
        }
        // 执行回调
        (_a = this.config) === null || _a === void 0 ? void 0 : _a.doneCallback();
    };
    ScratchCard.prototype._clear = function () {
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    // 计算刮开区域百分比, 即计算画布透明区域百分比
    ScratchCard.prototype._getFilledPercentage = function () {
        var imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        // 点阵数组, 4个字节为一个像素, 每个字节分别代表rgba
        var pixels = imgData.data;
        var threshold = 0; // 这里可以设置阈值表示代表透明的分界线
        var transparentPixelCount = 0;
        for (var i = 3; i < pixels.length; i += 4) {
            if (pixels[i] <= threshold) {
                transparentPixelCount++;
            }
        }
        return Number(((transparentPixelCount / (pixels.length / 4)) * 100).toFixed(2));
    };
    return ScratchCard;
}());
var canvas = document.getElementById('canvas');
new ScratchCard({
    canvas: canvas,
    coverImg: './scratch-2x.jpg',
    pixelRatio: 2,
    showAllPercent: 40,
    fadeOut: 400,
    doneCallback: function () {
        console.log('done');
    }
});
