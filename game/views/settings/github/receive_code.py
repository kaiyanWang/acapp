from django.http import JsonResponse
from django.shortcuts import redirect
from django.core.cache import cache
import requests
from urllib.parse import quote
from django.contrib.auth.models import User
from game.models.player.player import Player
from django.contrib.auth import login
from random import randint

def receive_code(request):
    data = request.GET
    code = data.get('code')  # 获取 GitHub 传回的授权码 code
    state = data.get('state')

    if not cache.has_key(state):
        return redirect("index")  # 其他人对服务器的攻击或用户在授权页面停留了2h
    cache.delete(state)

    apply_access_token_url = "https://github.com/login/oauth/access_token/"  # 获取access_token
    data = {
        'client_id': "Ov23li2n3MttGt46yXlq",
        "client_secret": "491426414479d32c0868699d598fe48aa30ee463",
        "code": code,
    }
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    access_token_resp = requests.post(apply_access_token_url, data=data, headers=headers).json()
    print(access_token_resp)
    access_token = access_token_resp['access_token']


    get_userinfo_url = "https://api.github.com/user"
    userinfo_headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/json"
    }
    userinfo_resp = requests.get(get_userinfo_url, headers=userinfo_headers).json()
    print(userinfo_resp)
    openid = userinfo_resp['id']
    username = userinfo_resp['login']
    photo = userinfo_resp['avatar_url']

    players = Player.objects.filter(openid=openid)
    if players.exists():  # 如果该用户已存在，则无需重新获取信息，直接登录
        login(request, players[0].user)
        return redirect("index")

    while User.objects.filter(username=username).exists():  # 如果有重复，在末尾增加数字
        username += str(randint(0, 9))

    user = User.objects.create(username=username)
    player = Player.objects.create(user=user, photo=photo, openid=openid)

    login(request, user)

    return redirect("index")
