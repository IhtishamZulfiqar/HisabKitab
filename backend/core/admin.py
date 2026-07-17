from django.contrib import admin

from .models import Budget, Category, Friend, Goal, GoalTransaction, Transaction, Wallet


class UserOwnedAdmin(admin.ModelAdmin):
    """Restricts non-superusers to seeing and editing only their own records."""

    exclude = ["user"]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser or not obj.user_id:
            obj.user = request.user
        super().save_model(request, obj, form, change)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        formfield = super().formfield_for_foreignkey(db_field, request, **kwargs)
        if not request.user.is_superuser and formfield is not None and hasattr(formfield, "queryset"):
            if "user" in [f.name for f in formfield.queryset.model._meta.fields]:
                formfield.queryset = formfield.queryset.filter(user=request.user)
        return formfield

    def has_change_permission(self, request, obj=None):
        if obj is not None and not request.user.is_superuser and obj.user_id != request.user.id:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if obj is not None and not request.user.is_superuser and obj.user_id != request.user.id:
            return False
        return super().has_delete_permission(request, obj)


admin.site.register(Wallet, UserOwnedAdmin)
admin.site.register(Category, UserOwnedAdmin)
admin.site.register(Friend, UserOwnedAdmin)
admin.site.register(Transaction, UserOwnedAdmin)
admin.site.register(Budget, UserOwnedAdmin)
admin.site.register(Goal, UserOwnedAdmin)
admin.site.register(GoalTransaction, UserOwnedAdmin)
