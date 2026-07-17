from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db import transaction as db_transaction
from django.utils import timezone


class Wallet(models.Model):
    class Kind(models.TextChoices):
        BANK = "bank", "Bank"
        MOBILE_WALLET = "mobile_wallet", "Mobile Wallet"
        CASH = "cash", "Cash"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallets")
    name = models.CharField(max_length=100)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.CASH)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["name"]
        unique_together = [["user", "name"]]

    def __str__(self):
        return self.name

    def recompute_balance(self):
        ins = self.transactions.filter(direction="IN").aggregate(total=models.Sum("amount"))["total"] or Decimal("0")
        outs = self.transactions.filter(direction="OUT").aggregate(total=models.Sum("amount"))["total"] or Decimal("0")
        self.current_balance = ins - outs
        Wallet.objects.filter(pk=self.pk).update(current_balance=self.current_balance)
        return self.current_balance


class Category(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)
    is_friend_related = models.BooleanField(default=False)
    is_goal_related = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"
        unique_together = [["user", "name"]]

    def __str__(self):
        return self.name


class Friend(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="friends")
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]
        unique_together = [["user", "name"]]

    def __str__(self):
        return self.name


class Transaction(models.Model):
    class Direction(models.TextChoices):
        IN = "IN", "In"
        OUT = "OUT", "Out"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions")
    wallet = models.ForeignKey(
        Wallet, on_delete=models.CASCADE, related_name="transactions"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    direction = models.CharField(max_length=3, choices=Direction.choices)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions"
    )
    friend = models.ForeignKey(
        Friend, on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions"
    )
    transfer_to_wallet = models.ForeignKey(
        Wallet, on_delete=models.SET_NULL, null=True, blank=True, related_name="incoming_transactions"
    )
    note = models.TextField(blank=True, default="")
    date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    # links the auto-generated paired leg of a wallet-to-wallet transfer back to its origin
    paired_transaction = models.OneToOneField(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="paired_by"
    )

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.direction} {self.amount} ({self.wallet})"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        creating_transfer = is_new and self.transfer_to_wallet_id
        if not self.user_id:
            self.user_id = self.wallet.user_id

        with db_transaction.atomic():
            super().save(*args, **kwargs)

            if creating_transfer:
                paired = Transaction.objects.create(
                    user=self.user,
                    wallet=self.transfer_to_wallet,
                    amount=self.amount,
                    direction=self.Direction.IN,
                    category=self.category,
                    note=self.note,
                    date=self.date,
                    paired_transaction=self,
                )
                self.paired_transaction = paired

            self.wallet.recompute_balance()
            if self.transfer_to_wallet_id:
                self.transfer_to_wallet.recompute_balance()

    def delete(self, *args, **kwargs):
        wallet = self.wallet
        other_wallet = self.transfer_to_wallet
        paired = None
        try:
            paired = self.paired_by
        except Transaction.paired_by.RelatedObjectDoesNotExist:
            paired = None

        with db_transaction.atomic():
            if paired:
                paired.delete()
            super().delete(*args, **kwargs)

        wallet.recompute_balance()
        if other_wallet:
            other_wallet.recompute_balance()


class Budget(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="budgets")
    label = models.CharField(max_length=150)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="budgets")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    month = models.DateField(help_text="Stored as the first day of the budget's month")

    class Meta:
        ordering = ["-month"]

    def __str__(self):
        return self.label

    def save(self, *args, **kwargs):
        self.month = self.month.replace(day=1)
        super().save(*args, **kwargs)

    @property
    def spent_amount(self):
        next_month = (self.month.replace(day=28) + timezone.timedelta(days=4)).replace(day=1)
        total = Transaction.objects.filter(
            category=self.category,
            direction=Transaction.Direction.OUT,
            date__gte=self.month,
            date__lt=next_month,
            transfer_to_wallet__isnull=True,
        ).aggregate(total=models.Sum("amount"))["total"] or Decimal("0")
        return total

    @property
    def remaining_amount(self):
        return self.amount - self.spent_amount

    @property
    def percent_used(self):
        if self.amount == 0:
            return Decimal("0")
        return round((self.spent_amount / self.amount) * 100, 2)


class Goal(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        PAUSED = "paused", "Paused"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="goals")
    name = models.CharField(max_length=150)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["-status", "deadline"]

    def __str__(self):
        return self.name

    @property
    def current_saved_amount(self):
        adds = self.contributions.filter(direction=GoalTransaction.Direction.ADD).aggregate(
            total=models.Sum("amount")
        )["total"] or Decimal("0")
        withdraws = self.contributions.filter(direction=GoalTransaction.Direction.WITHDRAW).aggregate(
            total=models.Sum("amount")
        )["total"] or Decimal("0")
        return adds - withdraws

    @property
    def percent_complete(self):
        if self.target_amount == 0:
            return Decimal("0")
        pct = (self.current_saved_amount / self.target_amount) * 100
        return round(min(pct, Decimal("100")), 2)

    @property
    def suggested_monthly_contribution(self):
        if not self.deadline:
            return None
        today = timezone.localdate()
        remaining_amount = self.target_amount - self.current_saved_amount
        if remaining_amount <= 0:
            return Decimal("0")
        months_left = (self.deadline.year - today.year) * 12 + (self.deadline.month - today.month)
        if self.deadline.day < today.day:
            months_left -= 1
        months_left = max(months_left, 1)
        return round(remaining_amount / months_left, 2)


class GoalTransaction(models.Model):
    class Direction(models.TextChoices):
        ADD = "ADD", "Add"
        WITHDRAW = "WITHDRAW", "Withdraw"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="goal_transactions")
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="contributions")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    direction = models.CharField(max_length=10, choices=Direction.choices)
    source_wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="goal_transactions")
    note = models.TextField(blank=True, default="")
    date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    linked_transaction = models.OneToOneField(
        Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name="linked_goal_transaction"
    )

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.direction} {self.amount} -> {self.goal}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        if not self.user_id:
            self.user_id = self.goal.user_id

        with db_transaction.atomic():
            if is_new:
                savings_category, _ = Category.objects.get_or_create(
                    user=self.user,
                    name="Savings-Goal",
                    defaults={"is_friend_related": False, "is_goal_related": True},
                )
                tx_direction = (
                    Transaction.Direction.OUT
                    if self.direction == self.Direction.ADD
                    else Transaction.Direction.IN
                )
                linked_tx = Transaction.objects.create(
                    user=self.user,
                    wallet=self.source_wallet,
                    amount=self.amount,
                    direction=tx_direction,
                    category=savings_category,
                    note=self.note or f"Goal: {self.goal.name}",
                    date=self.date,
                )
                self.linked_transaction = linked_tx

            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        linked_tx = self.linked_transaction
        with db_transaction.atomic():
            super().delete(*args, **kwargs)
            if linked_tx:
                linked_tx.delete()
