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
    appid = "165"
    redirect_uri = quote("http://39.99.43.230:8000/settings/acwing/web/receive_code/")  # 将特殊字符重新编码成非特殊字符
    scope = "userinfo"
    state = get_state()

    cache.set(state, True, 2*60*60)  # 有效期两小时

    apply_code_url = "https://www.acwing.com/third_party/api/oauth2/web/authrize/"
    return JsonResponse({
        'result': "success",
        'apply_code_url': apply_code_url +"?appid=%s&redirect_uri=%s&scope=%s&state=%s" % (appid, redirect_uri, scope, state),

    })

