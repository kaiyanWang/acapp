from django.http import JsonResponse
from django.shortcuts import redirect


def receive_code(request):
    data = request.GET
    code = data.get('code')
    state = data.get('state')
    print(code, state)
    return redirect("index")  # game/urls/index.py中name="index"的链接


