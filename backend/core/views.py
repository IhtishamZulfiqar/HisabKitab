from decimal import Decimal

from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Budget, Category, Friend, Goal, GoalTransaction, Transaction, Wallet
from .serializers import (
    BudgetSerializer,
    CategorySerializer,
    FriendSerializer,
    GoalSerializer,
    GoalTransactionSerializer,
    RegisterSerializer,
    TransactionSerializer,
    WalletSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "username": user.username},
            status=status.HTTP_201_CREATED,
        )


class WalletViewSet(viewsets.ModelViewSet):
    queryset = Wallet.objects.all()
    serializer_class = WalletSerializer

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FriendViewSet(viewsets.ModelViewSet):
    queryset = Friend.objects.all()
    serializer_class = FriendSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset().filter(user=self.request.user)
        return qs.annotate(
            _out=Sum("transactions__amount", filter=Q(transactions__direction=Transaction.Direction.OUT)),
            _in=Sum("transactions__amount", filter=Q(transactions__direction=Transaction.Direction.IN)),
        )

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        data = []
        for friend in qs:
            out_total = friend._out or Decimal("0")
            in_total = friend._in or Decimal("0")
            data.append(
                {
                    "id": friend.id,
                    "name": friend.name,
                    "net_balance": out_total - in_total,
                }
            )
        return Response(data)

    @action(detail=True, methods=["get"])
    def ledger(self, request, pk=None):
        friend = self.get_object()
        transactions = Transaction.objects.filter(friend=friend).order_by("date", "created_at")

        running = Decimal("0")
        entries = []
        for tx in transactions:
            if tx.direction == Transaction.Direction.OUT:
                running += tx.amount
            else:
                running -= tx.amount
            entries.append(
                {
                    "id": tx.id,
                    "date": tx.date,
                    "amount": tx.amount,
                    "direction": tx.direction,
                    "category": tx.category.name if tx.category else None,
                    "wallet": tx.wallet.name,
                    "note": tx.note,
                    "running_balance": running,
                }
            )

        entries.sort(key=lambda e: (e["date"], e["id"]), reverse=True)

        return Response(
            {
                "friend": {"id": friend.id, "name": friend.name},
                "net_balance": running,
                "entries": entries,
            }
        )


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related("wallet", "category", "friend", "transfer_to_wallet").all()
    serializer_class = TransactionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset().filter(user=self.request.user)
        params = self.request.query_params

        wallet = params.get("wallet")
        if wallet:
            qs = qs.filter(wallet_id=wallet)

        category = params.get("category")
        if category:
            qs = qs.filter(category_id=category)

        friend = params.get("friend")
        if friend:
            qs = qs.filter(friend_id=friend)

        direction = params.get("direction")
        if direction:
            qs = qs.filter(direction=direction)

        date_from = params.get("date_from")
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = params.get("date_to")
        if date_to:
            qs = qs.filter(date__lte=date_to)

        return qs

    @action(detail=False, methods=["post"], url_path="quick-add")
    def quick_add(self, request):
        data = request.data
        wallet_id = data.get("wallet")
        amount = data.get("amount")
        direction = data.get("direction")
        category_name = data.get("category")
        note = data.get("note", "")
        friend_id = data.get("friend")

        if not wallet_id or not amount or not direction:
            return Response(
                {"detail": "wallet, amount and direction are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            wallet = Wallet.objects.get(pk=wallet_id, user=request.user)
        except Wallet.DoesNotExist:
            return Response({"detail": "Wallet not found."}, status=status.HTTP_404_NOT_FOUND)

        category = None
        if category_name:
            category, _ = Category.objects.get_or_create(user=request.user, name=category_name)

        friend = None
        if friend_id:
            try:
                friend = Friend.objects.get(pk=friend_id, user=request.user)
            except Friend.DoesNotExist:
                return Response({"detail": "Friend not found."}, status=status.HTTP_404_NOT_FOUND)

        tx = Transaction.objects.create(
            user=request.user,
            wallet=wallet,
            amount=amount,
            direction=direction,
            category=category,
            friend=friend,
            note=note,
        )
        return Response(TransactionSerializer(tx).data, status=status.HTTP_201_CREATED)


class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.select_related("category").all()
    serializer_class = BudgetSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset().filter(user=self.request.user)
        month = self.request.query_params.get("month")
        if month:
            qs = qs.filter(month=month)
        return qs


class GoalViewSet(viewsets.ModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GoalTransactionViewSet(viewsets.ModelViewSet):
    queryset = GoalTransaction.objects.select_related("goal", "source_wallet").all()
    serializer_class = GoalTransactionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset().filter(user=self.request.user)
        goal = self.request.query_params.get("goal")
        if goal:
            qs = qs.filter(goal_id=goal)
        return qs


class DashboardView(APIView):
    def get(self, request):
        today = timezone.localdate()
        month_start = today.replace(day=1)
        if today.month == 12:
            next_month_start = today.replace(year=today.year + 1, month=1, day=1)
        else:
            next_month_start = today.replace(month=today.month + 1, day=1)

        wallets = Wallet.objects.filter(user=request.user)
        wallet_data = WalletSerializer(wallets, many=True).data
        total_balance = wallets.aggregate(total=Sum("current_balance"))["total"] or Decimal("0")

        month_transactions = Transaction.objects.filter(
            user=request.user, date__gte=month_start, date__lt=next_month_start
        )

        spend_by_category = (
            month_transactions.filter(direction=Transaction.Direction.OUT, transfer_to_wallet__isnull=True)
            .values("category__id", "category__name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        spend_by_category_data = [
            {
                "category_id": row["category__id"],
                "category_name": row["category__name"] or "Uncategorized",
                "total": row["total"],
            }
            for row in spend_by_category
        ]

        active_budgets = Budget.objects.filter(user=request.user, month=month_start).select_related("category")
        budgets_data = BudgetSerializer(active_budgets, many=True).data

        active_goals = Goal.objects.filter(user=request.user, status=Goal.Status.ACTIVE)
        goals_data = GoalSerializer(active_goals, many=True).data

        friends = Friend.objects.filter(user=request.user).annotate(
            _out=Sum("transactions__amount", filter=Q(transactions__direction=Transaction.Direction.OUT)),
            _in=Sum("transactions__amount", filter=Q(transactions__direction=Transaction.Direction.IN)),
        )
        friends_data = [
            {
                "id": f.id,
                "name": f.name,
                "net_balance": (f._out or Decimal("0")) - (f._in or Decimal("0")),
            }
            for f in friends
        ]

        total_in = month_transactions.filter(
            direction=Transaction.Direction.IN, transfer_to_wallet__isnull=True
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

        total_categorized_out = month_transactions.filter(
            direction=Transaction.Direction.OUT, transfer_to_wallet__isnull=True
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

        leakage = total_in - total_categorized_out
        leakage_flag = False
        if total_in > 0 and leakage > (total_in * Decimal("0.10")):
            leakage_flag = True

        return Response(
            {
                "wallets": wallet_data,
                "total_balance": total_balance,
                "month_spend_by_category": spend_by_category_data,
                "budgets": budgets_data,
                "goals": goals_data,
                "friends": friends_data,
                "leakage": {
                    "total_in": total_in,
                    "total_categorized_out": total_categorized_out,
                    "amount": leakage,
                    "flagged": leakage_flag,
                },
            }
        )
