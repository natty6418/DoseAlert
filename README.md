# DoseAlert 💊

**DoseAlert** is a comprehensive medication management application designed to help users schedule, track, and receive reminders for their medications seamlessly. The app provides intelligent reminders, adherence tracking, and detailed analytics to support your health journey.

## 🎯 Mission

Empowering you to take control of your health through consistent medication adherence and intelligent tracking.

## 🏗️ Architecture

DoseAlert is built as a full-stack application with:

- **Frontend**: React Native mobile app with Expo
- **Backend**: Django REST API with PostgreSQL
- **Deployment**: Render.com for backend, Expo for mobile distribution

## 📱 Frontend (React Native + Expo)

### Features
- **Medication Management**: Add, edit, and manage medication plans with custom dosages, schedules, and instructions
- **Smart Reminders**: Intelligent push notifications to keep you on track
- **Adherence Tracking**: Track when you take medications and view detailed analytics
- **Offline Support**: Works offline with local SQLite database and syncs when online
- **Camera Integration**: OCR functionality to scan medication labels
- **Analytics Dashboard**: Visual charts and insights about your medication adherence
- **Guest Mode**: Try the app without creating an account

### Tech Stack
- **React Native** with Expo SDK 51
- **Expo Router** for navigation
- **NativeWind** (Tailwind CSS for React Native)
- **Drizzle ORM** with SQLite for local storage
- **Expo Notifications** for push reminders
- **React Native Chart Kit** for analytics visualization
- **Expo Camera** for medication scanning

### Getting Started (Frontend)

```bash
cd frontend
npm install
npx expo start
```

### Available Scripts
- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm test` - Run unit tests
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Drizzle Studio

## 🚀 Backend (Django REST API)

### Features
- **RESTful API** with comprehensive medication management endpoints
- **JWT Authentication** with refresh token rotation
- **Adherence Tracking** with detailed analytics and reporting
- **Schedule Management** with timezone support
- **Reminder System** with status tracking
- **Batch Synchronization** for offline-first mobile experience
- **Comprehensive Analytics** with streak tracking and insights

### Tech Stack
- **Django 5.2.5** with Django REST Framework
- **PostgreSQL** for production database
- **JWT Authentication** with Simple JWT
- **Celery** for background tasks
- **Redis** for caching and task queue
- **WhiteNoise** for static file serving
- **Gunicorn** for production WSGI server
- **uv** for dependency management

### API Endpoints

#### Authentication
- `POST /api/auth/token/` - Login and get JWT tokens
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/users/register/` - User registration
- `POST /api/users/logout/` - Logout and blacklist token

#### Core Features
- `GET/POST /api/meds/` - Medication management
- `GET/POST /api/schedules/` - Schedule management
- `GET/POST /api/reminders/` - Reminder tracking
- `GET/POST /api/adherence/records/` - Adherence tracking
- `GET /api/adherence/summary/` - Adherence statistics
- `GET /api/adherence/report/` - Detailed analytics report
- `GET /api/analytics/summary/` - General analytics

#### Synchronization
- `POST /api/meds/sync/` - Batch sync medications
- `POST /api/schedules/sync/` - Batch sync schedules
- `POST /api/reminders/sync/` - Batch sync reminders
- `POST /api/adherence/sync/` - Batch sync adherence records

### Getting Started (Backend)

#### Prerequisites
- Python 3.12+
- uv (Python package manager)
- PostgreSQL (for production)

#### Local Development

```bash
cd backend

# Install dependencies
uv sync

# Set up environment variables
cp .env.example .env  # Edit with your settings

# Run migrations
uv run python manage.py migrate

# Create superuser
uv run python manage.py createsuperuser

# Start development server
uv run python manage.py runserver
```

#### Production Deployment

The backend is configured for deployment on Render.com with:

- **Dockerfile** with uv-based dependency management
- **render.yaml** for Render deployment configuration
- **Production security settings** (HTTPS, HSTS, secure cookies)
- **Environment-based configuration**

## 🗄️ Database Schema

### Core Models
- **User**: Authentication and profile information
- **Medication**: Medication details, dosage, and instructions
- **Schedule**: Medication timing and frequency
- **Reminder**: Individual reminder instances
- **AdherenceRecord**: Tracking when medications are taken
- **AdherenceStreak**: Streak tracking for motivation

### Key Features
- **Timezone Support**: All schedules respect user timezones
- **Soft Deletes**: Data preservation with is_deleted flags
- **Audit Trail**: Created/updated timestamps on all models
- **Foreign Key Relationships**: Proper data integrity

## 🔄 Offline-First Architecture

The app is designed for offline-first usage:

1. **Local Storage**: SQLite database for offline functionality
2. **Sync System**: Batch synchronization when online
3. **Conflict Resolution**: Server-side conflict resolution
4. **Data Integrity**: Transactional sync operations

## 📊 Analytics & Insights

### Adherence Tracking
- **Real-time Statistics**: Current adherence rates and streaks
- **Historical Reports**: Detailed analytics over time periods
- **Medication Breakdown**: Per-medication adherence analysis
- **Time-based Analysis**: Best/worst times for medication adherence
- **Trend Analysis**: Improvement tracking over time

### Visualizations
- **Charts**: Adherence rates, streaks, and trends
- **Progress Indicators**: Visual progress tracking
- **Insights**: AI-powered recommendations for improvement

## 🔐 Security Features

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Refresh Token Rotation**: Enhanced security with token rotation
- **Token Blacklisting**: Secure logout functionality

### Data Protection
- **User Isolation**: Users can only access their own data
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Django ORM protection
- **HTTPS Enforcement**: Production security headers

## 🚀 Deployment

### Backend (Render.com)
- **Automatic Deployments**: Git-based deployment
- **Environment Variables**: Secure configuration management
- **Database**: Managed PostgreSQL service
- **SSL**: Automatic HTTPS with custom domains

### Frontend (Expo)
- **Development Builds**: Custom development builds
- **Production Builds**: App Store and Play Store distribution
- **OTA Updates**: Over-the-air updates for non-native changes

## 🧪 Testing

### Frontend Testing
- **Unit Tests**: Jest with React Native Testing Library
- **Component Tests**: Isolated component testing
- **Coverage Reports**: Comprehensive test coverage

### Backend Testing
- **Unit Tests**: Django test framework
- **API Tests**: Endpoint testing with Django REST Framework
- **Integration Tests**: Full workflow testing

## 📚 Documentation

- **API Documentation**: Comprehensive REST API documentation
- **Frontend README**: Detailed frontend setup and usage
- **Backend README**: Backend development and deployment guide
- **Database Schema**: Complete data model documentation

---

**DoseAlert** - Making medication management simple and effective. 💊✨
