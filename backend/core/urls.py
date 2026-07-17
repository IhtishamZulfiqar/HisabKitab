from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BudgetViewSet,
    CategoryViewSet,
    DashboardView,
    FriendViewSet,
    GoalTransactionViewSet,
    GoalViewSet,
    TransactionViewSet,
    WalletViewSet,
)

router = DefaultRouter()
router.register("wallets", WalletViewSet, basename="wallet")
router.register("categories", CategoryViewSet, basename="category")
router.register("friends", FriendViewSet, basename="friend")
router.register("transactions", TransactionViewSet, basename="transaction")
router.register("budgets", BudgetViewSet, basename="budget")
router.register("goals", GoalViewSet, basename="goal")
router.register("goal-transactions", GoalTransactionViewSet, basename="goaltransaction")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("", include(router.urls)),
]
