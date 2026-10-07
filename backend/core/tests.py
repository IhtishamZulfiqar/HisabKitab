from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Budget, Category
from .psx import parse_price, parse_symbols
from .views import summarize_holdings


class BudgetDailyAverageTests(TestCase):
    def test_working_day_budget_averages(self):
        user = get_user_model().objects.create_user(username="u", password="p")
        category = Category.objects.create(user=user, name="Lunch")
        budget = Budget.objects.create(
            user=user, label="Lunch", category=category, amount=Decimal("10000"), month=date(2026, 10, 1), days=22
        )
        with (
            patch("core.models.timezone.localdate", return_value=date(2026, 10, 7)),
            patch.object(Budget, "spent_amount", Decimal("2000")),
        ):
            self.assertEqual(budget.days_used, 5)
            self.assertEqual(budget.avg_spent_per_day, Decimal("400"))
            self.assertEqual(budget.remaining_per_day, Decimal("470.59"))
        with patch("core.models.timezone.localdate", return_value=date(2026, 11, 3)):
            self.assertEqual(budget.days_used, 22)
            self.assertIsNone(budget.remaining_per_day)


class InvestmentTests(TestCase):
    def test_parse_price(self):
        self.assertEqual(parse_price('<div class="quote__close">Rs.1,408.24</div>'), Decimal("1408.24"))
        self.assertIsNone(parse_price("<h2>404 Not Found</h2>"))

    def test_parse_symbols(self):
        page = '<a class="tbl__symbol" href="/company/LUCK" data-title="Lucky Cement &amp; Co"><strong>LUCK</strong></a>'
        self.assertEqual(parse_symbols(page), [{"symbol": "LUCK", "name": "Lucky Cement & Co"}])

    def test_summarize_holdings(self):
        trades = [("LUCK", 10, Decimal("400")), ("LUCK", 10, Decimal("420")), ("OGDC", 5, Decimal("200"))]
        result = summarize_holdings(trades, {"LUCK": Decimal("450"), "OGDC": None})
        luck, ogdc = result["holdings"]
        self.assertEqual(luck["avg_price"], Decimal("410"))
        self.assertEqual(luck["profit_loss"], Decimal("800"))
        self.assertEqual(ogdc["profit_loss"], Decimal("0"))  # no price -> valued at cost
        self.assertEqual(result["total_invested"], Decimal("9200"))
        self.assertEqual(result["current_value"], Decimal("10000"))
