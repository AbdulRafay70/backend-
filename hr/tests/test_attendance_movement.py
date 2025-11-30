from django.test import TestCase
from django.utils import timezone
from datetime import timedelta, date
from hr import models


class AttendanceMovementTests(TestCase):
    def setUp(self):
        self.emp = models.Employee.objects.create(first_name='Test', last_name='User')

    def test_attendance_create_and_update(self):
        today = date.today()
        att = models.Attendance.objects.create(employee=self.emp, date=today, status='present')
        self.assertEqual(att.employee, self.emp)
        self.assertEqual(att.status, 'present')
        att.check_in = timezone.now()
        att.check_out = att.check_in + timedelta(hours=8)
        att.working_hours = timedelta(hours=8)
        att.save()
        att.refresh_from_db()
        self.assertIsNotNone(att.check_in)
        self.assertEqual(att.working_hours, timedelta(hours=8))

    def test_movement_log_duration(self):
        start = timezone.now()
        end = start + timedelta(hours=2, minutes=30)
        m = models.MovementLog.objects.create(employee=self.emp, start_time=start, end_time=end, reason='Meeting')
        self.assertEqual(m.duration, end - start)
