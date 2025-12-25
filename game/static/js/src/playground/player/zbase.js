class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, character, username, photo) {  // speed表示每秒移动height的百分比
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
        this.fireballs = [];  // 将每个人发的子弹存下来

        this.cur_skill = null;

        // 画头像，只有是机器人才不画头像
        if (this.character !== "robot") {
            this.img = new Image();
            this.img.src = this.photo;
        }

        if (this.character === "me") {
            this.fireball_coldtime = 3;  // 单位：秒
            this.fireball_img = new Image();
            this.fireball_img.src = "http://39.99.43.230:8000/static/image/playground/fireball.jfif";

            this.blink_coldtime = 5;  // 闪现冷却时间，单位：秒
            this.blink_img = new Image();
            this.blink_img.src = "http://39.99.43.230:8000/static/image/playground/blink.png";
        }
    }

    start(){
        this.playground.player_count ++ ;
        this.playground.notice_board.write("已就绪：" + this.playground.player_count + "人");

        if (this.playground.player_count >= 3) {
            this.playground.state = "fighting";
            this.playground.notice_board.write("Fighting");
        }

        if(this.character === "me"){
            this.add_listening_events();
        } else if (this.character === "robot"){
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
            if (outer.playground.state !== "fighting") {
                return false;
            }

            const rect = outer.ctx.canvas.getBoundingClientRect();  // 画布左上角相对于浏览器（0,0）的位置
            let tx = (e.clientX - rect.left) / outer.playground.scale, ty = (e.clientY - rect.top) / outer.playground.scale;
            if(e.which === 3){  // 鼠标右键为3
                outer.move_to(tx, ty);

                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_move_to(tx, ty);
                }
            } else if(e.which === 1) {  // 鼠标左键为1
                if (outer.cur_skill === "fireball") {
                    if (outer.fireball_coldtime > outer.eps) {
                        return false;
                    }

                    let fireball = outer.shoot_fireball(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_shoot_fireball(tx, ty, fireball.uuid);  // 广播：发射火球
                    }
                } else if (outer.cur_skill === "blink") {
                    if (outer.blink_coldtime > outer.eps) {
                        return false;
                    }
                    outer.blink(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_blink(tx, ty);  // 广播：闪现
                    }
                }

                outer.cur_skill = null;
            }
        });

        $(window).keydown(function(e) {
            // console.log(e.which);
            if (outer.playground.state !== "fighting") {
                return true;
            }

            
            if(e.which === 81) {  // q键
                if (outer.fireball_coldtime > outer.eps) {  // 技能还没冷却好
                    return true;
                }

                outer.cur_skill = "fireball";
                return false;
            } else if (e.which === 70) {  // f键
                if (outer.blink_coldtime > outer.eps) {  // 技能还没冷却好
                    return true;
                }

                outer.cur_skill = "blink";
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
        let fireball = new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, 0.01);
        this.fireballs.push(fireball);

        this.fireball_coldtime = 3;  // 放完技能后，重置冷却时间

        return fireball;
    }

    destroy_fireball(uuid) {
        for (let i = 0; i < this.fireballs.length; i ++) {
            let fireball = this.fireballs[i];
            if (fireball.uuid === uuid) {
                fireball.destroy();
                break;
            }
        }
    }

    blink(tx, ty) {
        let d = this.get_dist(this.x, this.y, tx, ty);
        d = Math.min(d, 0.8);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(angle);
        this.y += d * Math.sin(angle);

        this.blink_coldtime = 5;  // 重置CD
        this.move_length = 0;  // 闪现结束后应该静止，不能继续朝着目标点移动
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


    receive_attack(x, y, angle, damage, ball_uuid, attacker) {
        attacker.destroy_fireball(ball_uuid);
        this.x = x;
        this.y = y;
        this.is_attacked(angle, damage);
    }

    update(){
        this.spent_time += this.timedelta / 1000;

        if (this.character === "me" && this.playground.state === "fighting") {
            this.update_coldtime();
        }
        this.update_move();
        this.render();
    }

    update_coldtime() {
        this.fireball_coldtime -= this.timedelta / 1000;
        this.fireball_coldtime = Math.max(this.fireball_coldtime, 0);  // 防止小于0

        this.blink_coldtime -= this.timedelta / 1000;
        this.blink_coldtime = Math.max(this.blink_coldtime, 0);  // 防止小于0

    }

    update_move() {  // 更新移动
        this.spent_time += this.timedelta / 1000;
        if (this.character === "robot" && this.spent_time > 3 && Math.random() < 1 / 300.0) {  // ai球每5s释放炮弹,前3秒不射
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

        if (this.character === "me" && this.playground.state === "fighting") {
            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime() {
        let x = 1.5, y = 0.9, r= 0.04;

        let scale = this.playground.scale;  // 渲染时需要用绝对大小，需要乘上scale
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if (this.fireball_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / 3) - Math.PI / 2, true);
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            this.ctx.fill();
        }

        x = 1.62, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if (this.blink_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.blink_coldtime / 5) - Math.PI / 2, true);
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            this.ctx.fill();
        }
    }

    on_destroy() {  // 玩家死亡后pop掉
        if (this.character === "me") {
            this.playground.state = "over";
        }
        for (let i = 0; i < this.playground.players.length; i ++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
                break;
            }
        }
    }
}
