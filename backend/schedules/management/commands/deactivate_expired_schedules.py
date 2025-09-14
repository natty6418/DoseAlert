from django.core.management.base import BaseCommand
from django.utils import timezone
from schedules.models import Schedule
from datetime import date

class Command(BaseCommand):
    help = 'Deactivate schedules for medications that have passed their end date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deactivated without making changes',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed information about each schedule',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        
        # Find schedules with expired medications that are still active
        expired_schedules = Schedule.objects.filter(
            medication__end_date__lt=date.today(),
            active=True
        ).select_related('medication', 'user')
        
        count = expired_schedules.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No expired schedules found.')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would deactivate {count} expired schedules:')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Deactivating {count} expired schedules...')
            )
        
        # Process each expired schedule
        for schedule in expired_schedules:
            medication = schedule.medication
            user = schedule.user
            
            if verbose or dry_run:
                self.stdout.write(
                    f'  - {medication.name} for {user.username} '
                    f'(ended: {medication.end_date}, schedule: {schedule.time_of_day})'
                )
            
            if not dry_run:
                schedule.active = False
                schedule.save()
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deactivated {count} expired schedules.')
            )
        
        # Show summary of remaining active schedules
        active_count = Schedule.objects.filter(active=True).count()
        self.stdout.write(
            self.style.SUCCESS(f'Remaining active schedules: {active_count}')
        )
