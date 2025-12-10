from django.http import JsonResponse
from urllib.parse import quote
from random import randint
from django.core.cache import cache

def get_state():
    res = ""
    for i in range(8):
        res += str(randint(0, 9))
    return res


def apply_code(request):
    client_id = "Ov23li2n3MttGt46yXlq"
    redirect_uri = quote("http://39.99.43.230:8000/settings/github/receive_code/")
    scope = "userinfo"
    state = get_state()

    cache.set(state, True, 2*60*60)  # 有效期两小时

    github_oauth_url = "https://github.com/login/oauth/authorize/"
    return JsonResponse({
        'result': "success",
        'apply_code_url': github_oauth_url + "?client_id=%s&redirect_uri=%s&scope=%s&state=%s" % (client_id, redirect_uri, scope, state),
    });
