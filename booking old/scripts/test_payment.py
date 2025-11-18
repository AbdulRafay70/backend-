from booking.serializers import PaymentSerializer
from booking.models import Payment, Bank
from organization.models import Organization, Branch, Agency
org = Organization.objects.create(name='PayOrg')
branch = Branch.objects.create(organization=org, name='PayBranch')
# create a bank
bank = Bank.objects.create(organization=org, name='OrgBank', account_title='Org Account', account_number='123', iban='IBAN123')
agent_bank = Bank.objects.create(organization=org, name='AgentBank', account_title='Agent Account', account_number='456', iban='IBAN456')

payload = {
    'organization': org.id,
    'branch': branch.id,
    'method': 'bank_transfer',
    'amount': 1500.50,
    'remarks': 'Test payment',
    'status': 'Completed',
    'transaction_number': 'TRX12345',
    'agent_bank': agent_bank.id,
    'organization_bank': bank.id,
    'kuickpay_trn': 'KPT-999',
}

s = PaymentSerializer(data=payload)
print('valid?', s.is_valid(), s.errors)
if s.is_valid():
    p = s.save()
    """
    Script removed per request.
    """
import sys
sys.exit(0)
