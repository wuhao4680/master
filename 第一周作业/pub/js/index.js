/*
 TOUCH_EVENTS 由于click事件在移动设备上有200ms左右的延时，所以提供在移动设备上的触摸事件
 ele : 在哪个元素上触摸
 conf : {draw:'point'或'line'}，point：触摸范围在10px以内，当成点击事件;line：滑动事件;
 由于触摸事件会冒泡，但又不想阻止冒泡（多个元素的触摸事件都需要回调)，冒泡的时候会根据此参数选择执行哪个回调，不知是否还有更好的方法；

 callback : 回调函数
 */
function TOUCH_EVENTS(ele, conf, callback) {
    if (ele == null || ele == undefined) return;

    if (typeof(conf) != 'object') {
        if (typeof(conf) == 'function') {
            var callback = conf;
        }
        var conf = {};
    }
    var sets = {
        draw: 'point',
        prevent: true,        //阻止默认事件
        stopPropagation: false,//阻止冒泡
        defaultTranslateX: 0,  //X轴默认位置
        defaultTranslateY: 0   //Y轴默认位置
    };
    for (var i in conf) {
        sets[i] = conf[i];
    }
    if(sets.draw=='stop'){
        return false;
    }
    this.translateX = sets.defaultTranslateX;
    this.translateY = sets.defaultTranslateY;

    var TOUCH_EVENTS = this;

    //触摸设备上使用touch事件，非触摸设备使用mouse事件
    var is_support_touch = 'ontouchstart' in window;
    var TOUCH = is_support_touch ?
    {
        down: 'touchstart',
        move: 'touchmove',
        up: 'touchend'
    }
        :
    {
        down: 'mousedown',
        move: 'mousemove',
        up: 'mouseup'
    };


    ele.addEventListener(TOUCH.down, function (ev) {
        sets.down && sets.down();//按下的时候需要执行的函数
        var _this = this;
        var client_pos = (ev.targetTouches && ev.targetTouches[0]) || ev;
        var disX = client_pos.pageX - TOUCH_EVENTS.translateX;
        var disY = client_pos.pageY - TOUCH_EVENTS.translateY;
        var downX = client_pos.pageX;
        var downY = client_pos.pageY;
        function get_direction(x1, x2, y1, y2) {
            var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2);
            return xDelta >= yDelta ? (x1 - x2 > 0 ? 'horizontal.right' : 'horizontal.left') : (y1 - y2 > 0 ? 'vertical.down' : 'vertical.up')
        }
        function fnMove(ev) {
            var client_pos = (ev.targetTouches && ev.targetTouches[0]) || ev;
            var slide_direct = get_direction(client_pos.pageX, downX, client_pos.pageY, downY);
            if (sets.draw == 'line') {
                if (!sets.direct || slide_direct.indexOf(sets.direct) == 0) {
                    ev.preventDefault();
                }
            }
            TOUCH_EVENTS.translateX = client_pos.pageX - disX;
            TOUCH_EVENTS.translateY = client_pos.pageY - disY;

            if (typeof(sets.moving) == 'function') {
                if (!sets.direct || slide_direct.indexOf(sets.direct) == 0) {//根据“滑动的方向”与“设置的方向”是否一致来判断是否执行回调函数
                    sets.moving(_this, client_pos, downX, downY);//移动的时候的回调函数
                }
            }
            //alert(sets.draw);

        }

        function fnEnd(ev) {

            //ev.preventDefault();
            //ev.stopPropagation();

            _this.removeEventListener(TOUCH.move, fnMove, false);
            _this.removeEventListener(TOUCH.up, fnEnd, false);
            var auto=true;
            var client_pos = (ev.changedTouches && ev.changedTouches[0]) || ev;

            var slide_direct = get_direction(client_pos.pageX, downX, client_pos.pageY, downY);
            if (sets.draw == 'point') {
                if (Math.abs(client_pos.pageX - downX) <= 10 && Math.abs(client_pos.pageY - downY) <= 10) {
                    callback && callback(_this,auto);
                }
            } else if (sets.draw == 'line') {
                sets.up && sets.up();//松开的时候需要执行的函数，跟滑动的方向无关，如果设置了sets.up,一定会执行此函数
                if (!sets.direct || slide_direct.indexOf(sets.direct) == 0) {//根据“滑动的方向”与“设置的方向”是否一致来判断是否执行回调函数
                    callback && callback(_this, client_pos, downX, downY);//松开的时候的回调函数
                }
            }

        }
        _this.addEventListener(TOUCH.move, fnMove, false);
        _this.addEventListener(TOUCH.up, fnEnd, false);
        if (ev.prevent) ev.preventDefault();
        if (sets.stopPropagation) ev.stopPropagation();
    }, false);
}
function cycle_slide(conf) {
    var _this = this;

    var sets = {
        container: '',             //父容器，必须。
        direct: 'horizontal',   //方向，默认水平方向
        is_tab: true           //是否有标注切换到了哪张图片
        , timer: 3000           //自动切换的定时器
    };
    for (var i in conf) {
        sets[i] = conf[i];
    }

    var oBox = sets.container;
    this.oUl = oBox.children[0];
    this.oLi = this.oUl.children;

    var num = this.oLi.length;

    if (sets.is_tab) {
        var ol = document.createElement('ol');
        for (var i = 0; i < num; i++) {
            var li = document.createElement('li');
            if (i == 0) {
                li.className = 'on';
            }
            ol.appendChild(li);
            this.oLi[i].style.width = oBox.offsetWidth + 'px';
        }
        oBox.appendChild(ol);

        var oBtn = oBox.children[1].children;

    }

    this.oUl.innerHTML += this.oUl.innerHTML;

    this.oUl.style.width = oBox.offsetWidth * num * 2 + 'px';

    this.W = this.oUl.offsetWidth / 2;
    var iNow = 0;


    var autoscroll_timer = setInterval(autoscroll, sets.timer);

    var startMove_timer = null;

    function autoscroll() {
        iNow++;
        if (sets.is_tab) tab();
        startMove(_this.oUl, -iNow * _this.W / num);
    }

    function clearTimer() {
        clearInterval(startMove_timer);
        clearInterval(autoscroll_timer);
    }

    function setAutoTimer() {
        clearInterval(autoscroll_timer);
        autoscroll_timer = setInterval(autoscroll, sets.timer);
    }

    function tab() {
        for (var i = 0; i < oBtn.length; i++) {
            oBtn[i].className = '';
        }
        if (iNow > 0) {
            oBtn[iNow % oBtn.length].className = 'on';
        } else {
            oBtn[(iNow % oBtn.length + oBtn.length) % oBtn.length].className = 'on';
        }
    }
    function autoS(downY){
        if(downY){
            var id=document.getElementsByTagName('ul')[0];
            var zhi=id.style['-webkit-transform'];
            /(\d+)/.exec(zhi);
            var sum=RegExp.$1;
            var sum1=id.getElementsByTagName('li');
            if(sum == (sum1.length/2-1)*sum1[0].offsetWidth){
                console.log('这是最后一张');
               // _this.cycle_slide=new TOUCH_EVENTS(id, {draw: 'stop'});
            }

        }
    }
    function startMove(obj, iTarget,downY) {
        clearInterval(startMove_timer);
        startMove_timer = setInterval(function () {
            var speed = (iTarget - _this.cycle_slide.translateX) / 7;
            _this.cycle_slide.translateX = speed > 0 ? Math.ceil(_this.cycle_slide.translateX + speed) : Math.floor(_this.cycle_slide.translateX + speed);
            if (_this.cycle_slide.translateX < 0) {
                obj.style.WebkitTransform = 'translateX(' + _this.cycle_slide.translateX % _this.W + 'px)';
                autoS(downY);
            } else {
                obj.style.WebkitTransform = 'translateX(' + (_this.cycle_slide.translateX % _this.W - _this.W) % _this.W + 'px)';
                autoS(downY);
            }
        }, 30);
    }

    _this.cycle_slide = new TOUCH_EVENTS(_this.oUl, {draw: 'line', prevent: false, direct: sets.direct, down: clearTimer, up: setAutoTimer, moving: function (oUl, client_pos, downX, downY) {
        if (_this.cycle_slide.translateX < 0) {
            oUl.style.WebkitTransform = 'translateX(' + _this.cycle_slide.translateX % _this.W + 'px)';
        } else {
            oUl.style.WebkitTransform = 'translateX(' + (_this.cycle_slide.translateX % _this.W - _this.W) % _this.W + 'px)';
        }
    }}, function (oUl,client_pos, downX, downY) {
        if (Math.abs(client_pos.pageX - downX) > 10) {
            if (client_pos.pageX < downX) {
                iNow++;
                tab();
                startMove(_this.oUl, -iNow * _this.W / num,downY);
            } else {
                iNow--;
                tab();
                startMove(_this.oUl, -iNow * _this.W / num,downY);
            }
        } else {
            startMove(_this.oUl, -iNow * _this.W / num,downY);
        }
    });
    window.addEventListener('resize', function () {
        var w = oBox.offsetWidth * num;
        _this.oUl.style.width = w * 2 + 'px';
        _this.W = w;
    }, false);

}
