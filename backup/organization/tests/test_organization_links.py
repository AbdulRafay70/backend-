from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from organization.models import Organization, OrganizationLink


class OrganizationLinkTests(TestCase):
    def setUp(self):
        # Users
        self.superuser = User.objects.create_superuser(username="admin", email="a@a.com", password="pass")
        self.user_a = User.objects.create_user(username="user_a", password="pass")
        self.user_b = User.objects.create_user(username="user_b", password="pass")

        # Organizations
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")

        # Add users to orgs (ManyToMany)
        self.org_a.user.add(self.user_a)
        self.org_b.user.add(self.user_b)

        # API client
        self.client = APIClient()

    def test_superuser_can_create_link(self):
        self.client.force_authenticate(user=self.superuser)
        resp = self.client.post(
            "/api/organization-links/",
            data={"Main_organization_id": self.org_a.id, "Link_organization_id": self.org_b.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        # Verify in DB
        link = OrganizationLink.objects.filter(main_organization=self.org_a, link_organization=self.org_b).first()
        self.assertIsNotNone(link)
        self.assertEqual(link.main_organization_request, OrganizationLink.STATUS_PENDING)
        self.assertEqual(link.link_organization_request, OrganizationLink.STATUS_PENDING)

    def test_accept_flow_sets_request_status_true(self):
        # create link
        link = OrganizationLink.objects.create(
            main_organization=self.org_a,
            link_organization=self.org_b,
            link_organization_request=OrganizationLink.STATUS_PENDING,
            main_organization_request=OrganizationLink.STATUS_PENDING,
            request_status=False,
        )

        # user_a (member of main org) accepts
        self.client.force_authenticate(user=self.user_a)
        resp = self.client.post(f"/api/organization-links/{link.id}/accept/")
        self.assertEqual(resp.status_code, 200)
        link.refresh_from_db()
        self.assertEqual(link.main_organization_request, OrganizationLink.STATUS_ACCEPTED)
        self.assertFalse(link.request_status)

        # user_b (member of link org) accepts
        self.client.force_authenticate(user=self.user_b)
        resp = self.client.post(f"/api/organization-links/{link.id}/accept/")
        self.assertEqual(resp.status_code, 200)
        link.refresh_from_db()
        self.assertEqual(link.link_organization_request, OrganizationLink.STATUS_ACCEPTED)
        self.assertTrue(link.request_status)

    def test_reject_flow_sets_request_status_false(self):
        link = OrganizationLink.objects.create(
            main_organization=self.org_a,
            link_organization=self.org_b,
            link_organization_request=OrganizationLink.STATUS_PENDING,
            main_organization_request=OrganizationLink.STATUS_PENDING,
            request_status=False,
        )

        # user_b rejects
        self.client.force_authenticate(user=self.user_b)
        resp = self.client.post(f"/api/organization-links/{link.id}/reject/")
        self.assertEqual(resp.status_code, 200)
        link.refresh_from_db()
        self.assertEqual(link.link_organization_request, OrganizationLink.STATUS_REJECTED)
        self.assertFalse(link.request_status)
