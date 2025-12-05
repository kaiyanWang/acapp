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

    update() {
        this.render();
    }

    render() {  // 渲染
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}
