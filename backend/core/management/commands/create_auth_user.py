import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = "Create (or update) the single HisabKitab user from env vars and print their auth token"

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME", "admin")
        password = os.environ.get("ADMIN_PASSWORD", "changeme123")
        email = os.environ.get("ADMIN_EMAIL", "")

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username, defaults={"email": email, "is_staff": True, "is_superuser": True}
        )
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.email = email
        user.save()

        token, _ = Token.objects.get_or_create(user=user)

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} user '{username}'."))
        self.stdout.write(self.style.SUCCESS(f"Auth token: {token.key}"))
