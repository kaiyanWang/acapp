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
