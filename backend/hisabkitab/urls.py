from django.contrib import admin
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token

from core.views import RegisterView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", obtain_auth_token, name="api-login"),
    path("api/auth/register/", RegisterView.as_view(), name="api-register"),
    path("api/", include("core.urls")),
]
