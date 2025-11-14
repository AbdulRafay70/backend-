# Finance smoke tests (PowerShell)
# Usage: Run from repository root in an activated virtualenv
# .\finance\SMOKE_TESTS.ps1

Write-Host "Running finance smoke tests..."

Write-Host "1) Show migration plan"
python manage.py migrate --plan

Write-Host "2) Run focused booking+finance tests"
python manage.py test booking finance -v 2

Write-Host "3) (Optional) Run a tiny end-to-end smoke: create a booking and recalc P&L via Django shell"
python - <<'PY'
from booking.models import Booking
from finance.utils import calculate_profit_loss
from decimal import Decimal
b = Booking.objects.create(customer_name='Smoke Test', total_price=Decimal('123.45'))
calculate_profit_loss(b.id)
print('Created booking id', b.id)
PY

Write-Host "Smoke tests finished. If all tests passed, proceed to staging migration per MIGRATION_PLAN.md"
