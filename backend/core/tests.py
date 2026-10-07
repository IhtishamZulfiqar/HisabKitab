from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Budget, Category


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
