from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Medication
from .serializers import MedicationSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_meds(request):
    """
    Synchronize a batch of medications from a client.
    
    For each medication object:
    - If 'is_deleted' is True and ID exists, deletes the medication
    - If ID is provided and 'is_deleted' is False/missing, updates the medication
    - If ID is null/missing and 'is_deleted' is False/missing, creates a new medication
    """
    data = request.data
    if not isinstance(data, list):
        return Response({"error": "Request body must be a list of medication objects."}, status=status.HTTP_400_BAD_REQUEST)

    results = []
    
    try:
        with transaction.atomic():
            for item_data in data:
                med_id = item_data.get('id')
                is_deleted = item_data.get('is_deleted', False)

                if is_deleted and med_id:
                    # DELETE logic
                    try:
                        med = Medication.objects.get(id=med_id, user=request.user)
                        med.delete()
                        results.append({'status': 'deleted', 'id': med_id})
                    except Medication.DoesNotExist:
                        results.append({'status': 'error', 'id': med_id, 'errors': 'Medication not found for deletion.'})
                elif is_deleted and not med_id:
                    # Can't delete without an ID
                    results.append({'status': 'error', 'id': None, 'errors': 'Cannot delete medication without ID.'})
                elif med_id and not is_deleted:
                    # UPDATE logic
                    try:
                        med = Medication.objects.get(id=med_id, user=request.user)
                        # Remove sync-specific fields that shouldn't be saved to the model
                        clean_data = {k: v for k, v in item_data.items() if k not in ['user', 'is_deleted']}
                        serializer = MedicationSerializer(instance=med, data=clean_data, partial=True)
                        if serializer.is_valid():
                            serializer.save()
                            results.append({'status': 'updated', 'id': med.id})
                        else:
                            results.append({'status': 'error', 'id': med_id, 'errors': serializer.errors})
                    except Medication.DoesNotExist:
                        results.append({'status': 'error', 'id': med_id, 'errors': 'Medication not found.'})
                elif not med_id and not is_deleted:
                    # CREATE logic
                    clean_data = {k: v for k, v in item_data.items() if k not in ['id', 'user', 'is_deleted']}
                    serializer = MedicationSerializer(data=clean_data)
                    if serializer.is_valid():
                        new_med = serializer.save(user=request.user)
                        results.append({'status': 'created', 'id': new_med.id})
                    else:
                        results.append({'status': 'error', 'id': None, 'errors': serializer.errors})

            # Check if any errors occurred during the loop
            has_errors = any(r['status'] == 'error' for r in results)
            if has_errors:
                # If there are errors, roll back the entire transaction
                raise Exception("Errors occurred during sync, rolling back all changes.")

    except Exception as e:
        # The transaction is rolled back here
        return Response({
            'error': str(e),
            'details': [r for r in results if r['status'] == 'error']
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response(results, status=status.HTTP_200_OK)