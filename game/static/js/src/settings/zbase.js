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
    </div>
    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">注册</div>
    </div>
</div>
            `);

        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login.hide();
        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register.hide();

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
                    console.log(resp);
                    outer.hide();
                    outer.root.menu.show();
                } else {  // 未登录，弹出登录页面
                    console.log(resp);
                    outer.login();
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
    }

    hide() {
        this.$settings.hide();

    }

    show() {
        this.$settings.show();
    }
}
