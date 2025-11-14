from organization.models import Organization
qs = Organization.objects.all()
print('Total orgs:', qs.count())
for o in qs.order_by('id'):
    try:
        code = getattr(o, 'code', None)
    except Exception:
        code = None
    print('id=%s name=%s code=%s' % (o.id, getattr(o,'name',None), code))

# show orgs matching rafay or ORG-0006
print('\nMatches for rafay or ORG-0006:')
for o in Organization.objects.filter(name__icontains='rafay'):
    print('id=%s name=%s code=%s' % (o.id, o.name, getattr(o,'code',None)))
for o in Organization.objects.filter(code__icontains='ORG-0006'):
    print('id=%s name=%s code=%s' % (o.id, o.name, getattr(o,'code',None)))
