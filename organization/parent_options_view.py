"""
API endpoint to get organizations and branches for parent selection.
This replaces hardcoded demo data in the frontend.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from organization.models import Organization, Branch
from drf_spectacular.openapi import AutoSchema


class ParentOptionsView(APIView):
    schema = AutoSchema()
    """
    GET /api/parent-options/?type=<entity_type>
    
    Returns list of available parent entities from Organization/Branch tables:
    - For 'branch': returns all organizations
    - For 'agent': returns all branches
    - For 'employee': returns all organizations and branches
    """
    permission_classes = (AllowAny,)
    
    def get(self, request):
        entity_type = request.query_params.get('type')
        
        if entity_type == 'branch':
            # Branches need to select an organization as parent
            orgs = Organization.objects.all().order_by('name')
            data = [{
                'id': org.id,
                'name': org.name,
                'type': 'organization',
                'code': org.org_code,
                'email': org.email
            } for org in orgs]
            message = "Select an organization as parent for the branch"
            
        elif entity_type == 'agent':
            # Agencies need to select a branch as parent
            branches = Branch.objects.select_related('organization').all().order_by('name')
            data = [{
                'id': branch.id,
                'name': branch.name,
                'type': 'branch',
                'code': branch.branch_code,
                'organization': branch.organization.name if branch.organization else None
            } for branch in branches]
            message = "Select a branch as parent for the agency"
            
        elif entity_type == 'employee':
            # Employees can select Organization or Branch as parent
            orgs = Organization.objects.all().order_by('name')
            branches = Branch.objects.select_related('organization').all().order_by('name')
            
            data = []
            for org in orgs:
                data.append({
                    'id': org.id,
                    'name': org.name,
                    'type': 'organization',
                    'code': org.org_code
                })
            for branch in branches:
                data.append({
                    'id': branch.id,
                    'name': branch.name,
                    'type': 'branch',
                    'code': branch.branch_code,
                    'organization': branch.organization.name if branch.organization else None
                })
            message = "Select an organization or branch as parent for the employee"
            
        elif entity_type == 'organization':
            # Organizations don't need a parent
            return Response({
                "message": "Organizations do not require a parent",
                "data": []
            })
            
        else:
            return Response(
                {"error": f"Invalid type '{entity_type}'. Use: branch, agent, employee, or organization"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            "message": message,
            "entity_type": entity_type,
            "data": data
        })