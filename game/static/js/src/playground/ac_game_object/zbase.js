let AC_GAME_OBJECTS = [];

class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);

        this.has_called_start = false;  // 是否执行过start函数
        this.timedelta = 0;  // 帧间间隔，timedelta 负责 “让游戏逻辑的速度不随流畅度变化”，核心是把 “按帧计算” 改成 “按时间计算”
        
    }

    start() {  // 只会在第一帧执行一次

    }

    update() {  // 每一帧都会执行一次，除了第一帧

    }

    on_destroy(){  // 在被删除之前执行一次（死亡之前给对手加分）

    }

    destroy() {  // 删掉该物体
        this.on_destroy();

        for (let i = 0; i < AC_GAME_OBJECTS.length; i ++){
            if (AC_GAME_OBJECTS[i] === this) {
                AC_GAME_OBJECTS.splice(i, 1);  // 删除
                break;
            }
        }
    }
}

let last_timestamp;

let AC_GAME_ANIMATION = function(timestamp) {
    for(let i = 0; i < AC_GAME_OBJECTS.length; i++){
        let obj = AC_GAME_OBJECTS[i];
        if (!obj.has_called_start) {
            obj.start();
            obj.has_called_start = true;
        } else {
            obj.timedelta = timestamp - last_timestamp;
            obj.update();
        }
    }

    last_timestamp = timestamp;

    requestAnimationFrame(AC_GAME_ANIMATION);  // 不是普通递归，会暂停等待，每16.7ms执行一次
}

requestAnimationFrame(AC_GAME_ANIMATION);  // 浏览器提供的js方法，60fps的浏览器一秒钟会被调用60次(即16.7ms调用一次)，执行指定的函数
