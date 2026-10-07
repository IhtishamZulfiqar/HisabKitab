from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BudgetViewSet,
    CategoryViewSet,
    DashboardView,
    FriendViewSet,
    GoalTransactionViewSet,
    GoalViewSet,
    InvestmentsView,
    StockSymbolsView,
    StockTradeViewSet,
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
router.register("stock-trades", StockTradeViewSet, basename="stocktrade")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("investments/", InvestmentsView.as_view(), name="investments"),
    path("stock-symbols/", StockSymbolsView.as_view(), name="stock-symbols"),
    path("", include(router.urls)),
]
