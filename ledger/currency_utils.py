"""
Utility functions for currency conversion (SAR ↔ PKR) using RiyalRate model.
"""
from packages.models import RiyalRate
from django.core.exceptions import ObjectDoesNotExist

def get_riyal_rate_for_org(organization):
    """
    Fetch the latest RiyalRate for the given organization.
    Returns the rate as float, or raises ObjectDoesNotExist if not found.
    """
    return RiyalRate.objects.get(organization=organization).rate

def convert_sar_to_pkr(amount_sar, organization, rate=None):
    """
    Convert SAR to PKR using the provided rate or fetch from RiyalRate.
    """
    if rate is None:
        rate = get_riyal_rate_for_org(organization)
    return float(amount_sar) * float(rate)

def convert_pkr_to_sar(amount_pkr, organization, rate=None):
    """
    Convert PKR to SAR using the provided rate or fetch from RiyalRate.
    """
    if rate is None:
        rate = get_riyal_rate_for_org(organization)
    if float(rate) == 0:
        raise ValueError("Riyal rate cannot be zero for conversion.")
    return float(amount_pkr) / float(rate)
