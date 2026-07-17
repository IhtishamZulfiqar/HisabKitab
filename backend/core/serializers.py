from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Budget, Category, Friend, Goal, GoalTransaction, Transaction, Wallet

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            is_staff=True,
        )


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ["id", "name", "kind", "current_balance"]
        read_only_fields = ["current_balance"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "is_friend_related", "is_goal_related"]


class FriendSerializer(serializers.ModelSerializer):
    net_balance = serializers.SerializerMethodField()

    class Meta:
        model = Friend
        fields = ["id", "name", "net_balance"]

    def get_net_balance(self, obj):
        return obj.net_balance if hasattr(obj, "net_balance") else None


class TransactionSerializer(serializers.ModelSerializer):
    wallet_name = serializers.CharField(source="wallet.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    friend_name = serializers.CharField(source="friend.name", read_only=True, default=None)
    transfer_to_wallet_name = serializers.CharField(
        source="transfer_to_wallet.name", read_only=True, default=None
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "wallet",
            "wallet_name",
            "amount",
            "direction",
            "category",
            "category_name",
            "friend",
            "friend_name",
            "transfer_to_wallet",
            "transfer_to_wallet_name",
            "note",
            "date",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value

    def validate(self, attrs):
        transfer_to_wallet = attrs.get("transfer_to_wallet")
        wallet = attrs.get("wallet", getattr(self.instance, "wallet", None))
        if transfer_to_wallet and wallet and transfer_to_wallet == wallet:
            raise serializers.ValidationError("Cannot transfer a wallet to itself.")
        return attrs


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    spent_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    percent_used = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = Budget
        fields = [
            "id",
            "label",
            "category",
            "category_name",
            "amount",
            "month",
            "spent_amount",
            "remaining_amount",
            "percent_used",
        ]


class GoalTransactionSerializer(serializers.ModelSerializer):
    source_wallet_name = serializers.CharField(source="source_wallet.name", read_only=True)

    class Meta:
        model = GoalTransaction
        fields = [
            "id",
            "goal",
            "amount",
            "direction",
            "source_wallet",
            "source_wallet_name",
            "note",
            "date",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value


class GoalSerializer(serializers.ModelSerializer):
    current_saved_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    percent_complete = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    suggested_monthly_contribution = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, allow_null=True
    )

    class Meta:
        model = Goal
        fields = [
            "id",
            "name",
            "target_amount",
            "deadline",
            "status",
            "current_saved_amount",
            "percent_complete",
            "suggested_monthly_contribution",
        ]
