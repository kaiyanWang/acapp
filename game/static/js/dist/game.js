class AcGameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            单人模式
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            多人模式
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings">
            退出
        </div>
    </div>
</div>
        `);
        this.$menu.hide();
        this.root.$ac_game.append(this.$menu);
        this.$single_mode = this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings');

        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.$single_mode.click(function(){
            outer.hide();
            outer.root.playground.show("single mode");
        });
        this.$multi_mode.click(function(){
            outer.hide();
            outer.root.playground.show("multi mode");
        });
        this.$settings.click(function(){
            outer.root.settings.logout_on_remote();
        });
    }

    show() {  // 显示muenu界面
        this.$menu.show();
    }

    hide() { // 关闭menu界面
        this.$menu.hide();
    }

}
let AC_GAME_OBJECTS = [];

class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);

        this.has_called_start = false;  // 是否执行过start函数
        this.timedelta = 0;  // 帧间间隔，timedelta 负责 “让游戏逻辑的速度不随流畅度变化”，核心是把 “按帧计算” 改成 “按时间计算”
        this.uuid = this.create_uuid();

        console.log(this.uuid);
    }

    create_uuid() {
        let res = "";
        for (let i = 0; i < 8; i ++) {
            let x = parseInt(Math.floor(Math.random() * 10));  // Math.random()返回 [0,1) 的数
            res += x;
        }
        return res;
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
class GameMap extends AcGameObject {
    constructor(playground) {
        super();  // 调用父类AcGameObject的构造函数，执行.push()，将自己放到AC_GAME_OBJECTS数组
        this.playground = playground;
        this.$canvas = $(`<canvas></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');  // ctx是画布的引用
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);  // 将$canvas加入$playground

        this.start();
    }

    start() {
        
    }

    resize() {  // 动态修改长宽
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
    }

    update() {
        this.render();
    }

    render() {  // 渲染
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}
class Particle extends AcGameObject {
    constructor(playground, x, y, radius, vx, vy, color, speed, move_length) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.friction = 0.9;
        this.eps = 0.01;
    }

    start() {
    }

    update() {
        if (this.move_length < this.eps || this.speed < this.eps) {
            this.destroy();
            return false;
        }
        
        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.speed *= this.friction;
        this.move_length -= moved;
        this.render();
    }

    render() {
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

}
class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, character, username, photo) {  // speed表示每秒移动height的百分比
        console.log(character, username, photo);
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0;  // vx，vy表示速度的方向
        this.vy = 0
        this.damage_x = 0;
        this.damage_y = 0;
        this.damage_speed = 0;
        this.move_length = 0;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.character = character;
        this.username = username;
        this.photo = photo;
        this.eps = 0.01;
        this.friction = 0.9;
        this.spent_time = 0;

        this.cur_skill = null;

        // 画头像，只有是机器人才不画头像
        if (this.character !== "robot") {
            this.img = new Image();
            this.img.src = this.photo;
        }
    }

    start(){
        if(this.character === "me"){
            this.add_listening_events();
        } else {
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
            this.move_to(tx, ty);
        }
    }

    add_listening_events() {
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function() {
            return false;
        });
        this.playground.game_map.$canvas.mousedown(function (e) {
            const rect = outer.ctx.canvas.getBoundingClientRect();  // 画布左上角相对于浏览器（0,0）的位置
            let tx = (e.clientX - rect.left) / outer.playground.scale, ty = (e.clientY - rect.top) / outer.playground.scale;
            if(e.which === 3){  // 鼠标右键为3
                outer.move_to(tx, ty);
            } else if(e.which === 1) {  // 鼠标左键为1
                if (outer.cur_skill === "fireball") {
                    outer.shoot_fireball(tx, ty);
                }

                outer.cur_skill = null;
            }
        });

        $(window).keydown(function(e) {
            if(e.which === 81) {  // q键
                outer.cur_skill = "fireball";
                return false;
            }
        });
    }

    shoot_fireball(tx, ty) {
        let x = this.x, y = this.y;
        let radius = 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = 0.5;
        let move_length = 1;
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, 0.01);
    }

    get_dist(x1, y1, x2,y2) {
        let dx = x1 -x2;
        let dy = y1 - y2;
        return Math.sqrt(dx*dx + dy*dy);
    }

    move_to(tx, ty) {
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    is_attacked(angle, damage) {  // 玩家被击中

        for (let i = 0; i < 20 + Math.random() * 20; i ++) {  // 实现粒子攻击效果
            let x = this.x, y = this.y;
            let radius = this.radius * Math.random() * 0.1;
            let angle = Math.PI * 2 * Math.random();
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 10;
            let move_length = this.radius * Math.random() * 5;
            new Particle(this.playground, x, y, radius, vx, vy, color, speed, move_length);
        }

        this.radius -= damage;
        if (this.radius < this.eps) {  // 血量值为半径，半径小于0.01*height认为死亡
            this.destroy();
            return false;
        }
        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;
        this.speed *= 0.8;
    }

    update(){
        this.update_move();
        this.render();
    }

    update_move() {  // 更新移动
       this.spent_time += this.timedelta / 1000;
        if (this.character === "robot" && this.spent_time > 4 && Math.random() < 1 / 300.0) {  // ai球每5s释放炮弹,前4秒不射
            let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];  // 单人模式下，ai朝其他ai和玩家射
            let tx = player.x + player.vx * player.speed * this.timedelta / 1000;
            let ty = player.y + player.vy * player.speed * this.timedelta / 1000;  // AI预判
            this.shoot_fireball(player.x, player.y);
        }
        if (this.damage_speed > this.eps) {
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_x * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_y * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.friction;
        } else{
            if (this.move_length < this.eps) {
                this.move_length = 0;
                this.vx = this.vy = 0;
                if (this.character === "robot") {  // ai随机移动
                    let tx = Math.random() * this.playground.width / this.playground.scale;
                    let ty = Math.random() * this.playground.height / this.playground.scale;
                    this.move_to(tx, ty);
                }
            } else {
                let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);  // timedelta的单位是毫秒
                this.x += this.vx * moved;
                this.y += this.vy * moved;

                this.move_length -= moved;

            }
        }
    }

    render(){
        let scale = this.playground.scale;  // 渲染时需要用绝对大小，需要乘上scale
        if (this.character !== "robot") {  // 画头像
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        } else {  // 机器人纯色
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI *2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }
    }

    on_destroy() {  // 玩家死亡后pop掉
        for (let i = 0; i < this.playground.players.length; i ++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
            }
        }
    }
}
class FireBall extends AcGameObject {
    constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length, damage) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.damage = damage;
        this.eps = 0.01;
    }

    start() {

    }

    get_dist(x1, y1, x2, y2) {  // 求距离
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    is_collision(player) {  // 碰撞检测
        let distance = this.get_dist(this.x, this.y, player.x, player.y);
        if (player.radius + this.radius >= distance) return true;
        return false;
    }

    attack(player) {  // 攻击
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(angle, this.damage);
        this.destroy();
    }

    update() {
        if (this.move_length < this.eps) {
            this.destroy();
            return false;
        }

        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.move_length -= moved;

        for (let i= 0; i < this.playground.players.length; i++) {
            let player = this.playground.players[i];
            if (this.player !== player && this.is_collision(player)) {
                this.attack(player);
            }
        }

        this.render();
    }

    render() {
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class MultiPlayerSocket {
    constructor (playground) {
        this.playground = playground;

        this.ws = new WebSocket("ws://39.99.43.230:5015/ws/multiplayer/");

        this.start();
    }

    start() {
        this.receive();
    }

    receive () {
        let outer = this;
        this.ws.onmessage = function(e) {
            let data = JSON.parse(e.data);
            let uuid = data.uuid;
            console.log(uuid, data.uuid, outer.uuid);
            if (uuid === outer.uuid) return false;

            let event = data.event;
            if (event === "create_player") {
                outer.receive_create_player(uuid, data.username, data.photo);
            }
        }
    }

    send_create_player(username, photo) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "create_player",
            'uuid': outer.uuid,
            'username': username,
            'photo': photo
        }));
    }

    receive_create_player(uuid, username, photo) {
        let player = new Player(this.playground, this.playground.width / 2 / this.playground.scale, 0.5, 0.05, "white", 0.15, "enemy", username, photo);

        player.uuid = uuid;
        this.playground.players.push(player);
    }

}
class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`
<div class="ac-game-playground">
</div>
        `);
        this.hide();
        this.root.$ac_game.append(this.$playground);  // 将$playground加入$ac_game
        this.start();
    }

    get_random_color() {
        let colors = ["blue", "red", "pink", "grey", "green"];
        return colors[Math.floor(Math.random() * 5)];
    }

    start() {
        let outer = this;
        // 用户改变窗口大小时，触发this.resize()
        $(window).resize(function() {
            outer.resize();
        });
    }

    resize() {
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        let unit = Math.min(this.width / 16, this.height / 9);
        this.width = unit * 16;
        this.height = unit * 9;
        this.scale = this.height;

        if (this.game_map) this.game_map.resize();
    }

    update() {
    }

    show(mode) {  // 打开playground界面
        let outer = this;
        this.$playground.show();

        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.game_map = new GameMap(this);

        this.resize();

        this.players = [];
        this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, "white", 0.15, "me", this.root.settings.username, this.root.settings.photo));

        if (mode === "single mode") {  // 单人模式，加机器人
           for (let i = 0; i < 5; i ++) {
                this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, this.get_random_color(), 0.15, "robot"));
            }
        } else if (mode === "multi mode") {  // 多人模式，联机对战
            this.mps = new MultiPlayerSocket(this);
            this.mps.uuid = this.players[0].uuid;

            this.mps.ws.onopen = function() {
                outer.mps.send_create_player(outer.root.settings.username, outer.root.settings.photo);
            }

        }
 
    }

    hide() {  // 关闭playground界面
        this.$playground.hide();
    }
}
class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB";
        if (this.root.AcWingOS) this.platform = "ACAPP";
        this.username = "";
        this.photo = "";

        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">登录</div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message"></div>
        <div class="ac-game-settings-option">
            注册
        </div>
        <br>

		<div class="ac-game-settings-third-party">
			<div class="ac-game-settings-github">
				<img width="30" src="http://39.99.43.230:8000/static/image/settings/github_logo.png">
				<div>github一键登录</div>
			</div>
			<div class="ac-game-settings-wechat">
				<img width="30" src="https://cdn.jsdelivr.net/npm/ionicons@5.5.2/dist/ionicons/svg/logo-wechat.svg">
				<div>微信一键登录</div>
			</div>
		</div>
</div>

    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">注册</div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="确认密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message"></div>
        <div class="ac-game-settings-option">
            登录
        </div>
        <br>
        <div class="ac-game-settings-third-party">
            <div class="ac-game-settings-github">
                <img width="30" src="http://39.99.43.230:8000/static/image/settings/github_logo.png">
                <div>github一键登录</div>
            </div>
            <div class="ac-game-settings-wechat">
                <img width="30" src="https://cdn.jsdelivr.net/npm/ionicons@5.5.2/dist/ionicons/svg/logo-wechat.svg">
                <div>微信一键登录</div>
            </div>
        </div>

    </div>
            `);

        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input");
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");

        this.$login.hide();

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input")
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");

        this.$register.hide();

        this.$github_login = this.$settings.find('.ac-game-settings-github img');
		this.$wechat_login = this.$settings.find('.ac-game-settings-wechat img');

        this.root.$ac_game.append(this.$settings);

        this.start();
    }

    getinfo() {
        let outer = this;
        $.ajax({
            url: "http://39.99.43.230:8000/settings/getinfo/",
            type: "get",
            data: {
                platform: outer.platform,
            },
            success: function(resp) {
                if(resp.result === "success") {  // getinfo成功，即已登录，将当前界面隐藏，打开菜单界面
                    outer.userame = resp.username;
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                } else {  // 未登录，弹出登录页面
                    outer.login();
                    // outer.register();
                }
            }
        });
    }

    register() {  // 打开注册界面
        this.$login.hide();
        this.$register.show();
    }

    login() {  // 打开登录界面
        this.$register.hide();
        this.$login.show();


    }

    start() {
        this.getinfo();
        this.add_listening_events();
    }

    add_listening_events () {  // 监听函数
        let outer = this;
        this.add_listening_events_login();
        this.add_listening_events_register();
        
        this.$github_login.click(function() {
            outer.github_login();
        });
        this.$wechat_login.click(function() {
            outer.wechat_login();
        });
    }

    add_listening_events_login() {
        let outer = this;
        this.$login_register.click(function() {
            outer.register();
        });
        this.$login_submit.click(function() {
            outer.login_on_remote();
        });

    }

    add_listening_events_register() {
        let outer = this;
        this.$register_login.click(function() {
            outer.login();
        });
        this.$register_submit.click(function() {
            outer.register_on_remote();
        });
    }

    github_login() {  // github一键登录
        $.ajax({
            url: "http://39.99.43.230:8000/settings/github/apply_code/",
            type: "get",
            data: {
            },
            success(resp) {
                if (resp.result === "success") {
                    window.location.replace(resp.apply_code_url);
                }
            }
        });
    }

    wechat_login() {
        $.ajax({
            url: "",
            type: "get",
            success(resp) {
            }
        });
    }

    login_on_remote() {  // 在远程服务器上登录
        let outer = this;
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty();
        $.ajax({
            url: "http://39.99.43.230:8000/settings/login/",
            type: "get",
            data: {
                username: username,
                password: password
            },
            success(resp) {
                if (resp.result === "success") {
                    location.reload();  // 刷新页面，getinfo()能获得信息，所以进入
                } else {
                    outer.$login_error_message.html(resp.result);
                }
            }

        });
    }

    logout_on_remote() {  // 在远程服务器上登出
        $.ajax({
            url: "http://39.99.43.230:8000/settings/logout/",
            type: "get",
            success(resp) {
                if (resp.result === "success") {
                    location.reload();
                }
            }
        });
    }

    register_on_remote() {  // 在远程服务器上注册
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_message.empty();
        $.ajax({
            url: "http://39.99.43.230:8000/settings/register/",
            type: "get",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success(resp) {
                console.log(resp);
                console.log(username, password, password_confirm);
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$register_error_message.html(resp.result);
                }
            }
        });
    }

    hide() {
        this.$settings.hide();

    }

    show() {
        this.$settings.show();
    }
}
export class AcGame {
    constructor(id, AcWingOS) {
       this.id = id;
       this.AcWingOS = AcWingOS;
       this.$ac_game = $('#' + id);

       this.settings = new Settings(this);
       this.menu = new AcGameMenu(this);
       this.playground = new AcGamePlayground(this);

        this.start();
    }

    start(){
    }
}
