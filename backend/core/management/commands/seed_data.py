from django.core.management.base import BaseCommand

from core.models import Category, Wallet

DEFAULT_WALLETS = [
    ("Meezan", Wallet.Kind.BANK),
    ("JazzCash", Wallet.Kind.MOBILE_WALLET),
    ("EasyPaisa", Wallet.Kind.MOBILE_WALLET),
    ("SadaPay", Wallet.Kind.MOBILE_WALLET),
    ("Cash Pocket", Wallet.Kind.CASH),
]

DEFAULT_CATEGORIES = [
    ("Home Expenses", False, False),
    ("Daily-Lunch", False, False),
    ("Petrol", False, False),
    ("Outing", False, False),
    ("Bills", False, False),
    ("Savings-Goal", False, True),
    ("Misc", False, False),
    ("Lend", True, False),
    ("Borrow", True, False),
]


class Command(BaseCommand):
    help = "Seed default wallets and categories for HisabKitab"

    def handle(self, *args, **options):
        created_wallets = 0
        for name, kind in DEFAULT_WALLETS:
            _, created = Wallet.objects.get_or_create(name=name, defaults={"kind": kind})
            created_wallets += int(created)

        created_categories = 0
        for name, is_friend_related, is_goal_related in DEFAULT_CATEGORIES:
            _, created = Category.objects.get_or_create(
                name=name,
                defaults={
                    "is_friend_related": is_friend_related,
                    "is_goal_related": is_goal_related,
                },
            )
            created_categories += int(created)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created_wallets} new wallet(s) and {created_categories} new category(ies)."
            )
        )
