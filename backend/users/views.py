from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer

User = get_user_model()

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def debug_register(request):
    """
    Debug endpoint to test registration
    """
    if request.method == 'GET':
        return Response({
            'message': 'Registration endpoint is working',
            'method': 'GET',
            'user_model_fields': [field.name for field in User._meta.fields]
        })
    
    elif request.method == 'POST':
        print(f"Debug: Received POST data: {request.data}")
        print(f"Debug: Content type: {request.content_type}")
        print(f"Debug: Headers: {dict(request.META)}")
        
        return Response({
            'message': 'POST received',
            'data_received': request.data,
            'content_type': request.content_type
        })

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        try:
            print(f"=== REGISTRATION REQUEST START ===")
            print(f"Request method: {request.method}")
            print(f"Request path: {request.path}")
            print(f"Request content type: {request.content_type}")
            print(f"Request META: {dict(request.META)}")
            print(f"Request body: {request.body}")
            print(f"Request data: {request.data}")
            print(f"=== REGISTRATION REQUEST DATA END ===")
        except Exception as e:
            print(f"Exception during request parsing: {e}")
            import traceback
            print(traceback.format_exc())
            return Response({'error': 'Request parsing failed', 'details': str(e)}, status=400)
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            # Return detailed validation errors
            print(f"Serializer validation errors: {serializer.errors}")
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors,
                'message': 'Please check the provided data and try again'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = serializer.save()
            
            # Generate JWT tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error during user creation: {str(e)}")
            print(f"Exception type: {type(e).__name__}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            return Response({
                'error': 'User creation failed',
                'details': str(e),
                'message': 'An error occurred while creating the user account'
            }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.GenericAPIView):
    """
    User login endpoint
    """
    permission_classes = (AllowAny,)
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)


class LogoutView(generics.GenericAPIView):
    """
    User logout endpoint (blacklist refresh token)
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get and update user profile
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

ALLOWED_HOSTS = [
   '*' 
]
