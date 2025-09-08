# DoseAlert Backend API Documentation

A comprehensive medication reminder and adherence tracking system.

## Base URL
```
http://localhost:8000/api/
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifetimes

- **Access Token**: 30 minutes
- **Refresh Token**: 1 day (24 hours)

**Important Notes:**
- Access tokens expire after 30 minutes and must be refreshed
- Refresh tokens expire after 1 day, requiring re-login
- Refresh tokens are rotated (new refresh token issued) for security
- Old refresh tokens are blacklisted after rotation

### Authentication Endpoints

#### POST `/api/auth/token/`
Obtain JWT tokens (login)

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Response:**
```json
{
    "access": "string",
    "refresh": "string"
}
```

#### POST `/api/auth/refresh/`
Refresh access token

**Request Body:**
```json
{
    "refresh": "string"
}
```

**Response:**
```json
{
    "access": "string"
}
```

---

## User Management

### POST `/api/users/register/`
Register a new user

**Permission:** Public

**Request Body:**
```json
{
    "username": "string",
    "email": "string",
    "password": "string",
    "first_name": "string",
    "last_name": "string"
}
```

**Response:**
```json
{
    "user": {
        "id": 1,
        "username": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string"
    },
    "refresh": "string",
    "access": "string",
    "message": "User registered successfully"
}
```

### POST `/api/users/login/`
User login

**Permission:** Public

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Response:**
```json
{
    "user": {
        "id": 1,
        "username": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string"
    },
    "refresh": "string",
    "access": "string",
    "message": "Login successful"
}
```

### POST `/api/users/logout/`
User logout (blacklist refresh token)

**Permission:** Authenticated

**Request Body:**
```json
{
    "refresh": "string"
}
```

**Response:**
```json
{
    "message": "Logout successful"
}
```

### GET `/api/users/profile/`
Get current user profile

**Permission:** Authenticated

**Response:**
```json
{
    "id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
}
```

### PUT/PATCH `/api/users/profile/`
Update user profile

**Permission:** Authenticated

**Request Body:**
```json
{
    "first_name": "string",
    "last_name": "string",
    "email": "string"
}
```

---

## Medications

### GET `/api/meds/`
List all medications for authenticated user

**Permission:** Authenticated

**Response:**
```json
[
    {
        "id": 1,
        "name": "Medication Name",
        "directions": "Take with food",
        "side_effects": "May cause drowsiness",
        "purpose": "Pain relief",
        "warnings": "Do not exceed recommended dose",
        "dosage_amount": "10.00",
        "dosage_unit": "mg",
        "notes": "User notes",
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "frequency": "Once daily",
        "created_at": "2025-01-01T00:00:00Z"
    }
]
```

### POST `/api/meds/`
Create a new medication

**Permission:** Authenticated

**Request Body:**
```json
{
    "name": "Medication Name",
    "directions": "Take with food",
    "side_effects": "May cause drowsiness",
    "purpose": "Pain relief",
    "warnings": "Do not exceed recommended dose",
    "dosage_amount": "10.00",
    "dosage_unit": "mg",
    "notes": "User notes",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "frequency": "Once daily"
}
```

### GET `/api/meds/{id}/`
Get specific medication

**Permission:** Authenticated (own medications only)

### PUT/PATCH `/api/meds/{id}/`
Update medication

**Permission:** Authenticated (own medications only)

### DELETE `/api/meds/{id}/`
Delete medication

**Permission:** Authenticated (own medications only)

---

## Schedules

### GET `/api/schedules/`
List all schedules for authenticated user

**Permission:** Authenticated

**Response:**
```json
[
    {
        "id": 1,
        "medication": {
            "id": 1,
            "name": "Medication Name"
        },
        "time_of_day": "08:00:00",
        "days_of_week": "Mon,Tue,Wed,Thu,Fri",
        "timezone": "UTC",
        "active": true,
        "created_at": "2025-01-01T00:00:00Z",
        "is_medication_expired": false,
        "is_effectively_active": true
    }
]
```

### POST `/api/schedules/`
Create a new schedule

**Permission:** Authenticated

**Request Body:**
```json
{
    "medication": 1,
    "time_of_day": "08:00:00",
    "days_of_week": "Mon,Tue,Wed,Thu,Fri",
    "timezone": "UTC",
    "active": true
}
```

### GET `/api/schedules/{id}/`
Get specific schedule

**Permission:** Authenticated (own schedules only)

### PUT/PATCH `/api/schedules/{id}/`
Update schedule

**Permission:** Authenticated (own schedules only)

### DELETE `/api/schedules/{id}/`
Delete schedule

**Permission:** Authenticated (own schedules only)

---

## Reminders

### GET `/api/reminders/`
List all reminders for authenticated user

**Permission:** Authenticated

**Response:**
```json
[
    {
        "id": 1,
        "schedule": {
            "id": 1,
            "medication": {
                "name": "Medication Name"
            }
        },
        "medication": {
            "id": 1,
            "name": "Medication Name"
        },
        "scheduled_at": "2025-01-01T08:00:00Z",
        "sent_at": "2025-01-01T08:00:00Z",
        "status": "sent"
    }
]
```

### GET `/api/reminders/{id}/`
Get specific reminder

**Permission:** Authenticated (own reminders only)

---

## Adherence Tracking

### GET `/api/adherence/records/`
List adherence records

**Permission:** Authenticated

**Response:**
```json
[
    {
        "id": 1,
        "medication": {
            "id": 1,
            "name": "Medication Name"
        },
        "reminder": 1,
        "status": "taken",
        "scheduled_time": "2025-01-01T08:00:00Z",
        "actual_time": "2025-01-01T08:05:00Z",
        "response_time": "2025-01-01T08:05:00Z",
        "is_late": false,
        "minutes_late": 5,
        "notes": "Took with breakfast",
        "created_at": "2025-01-01T08:05:00Z"
    }
]
```

### POST `/api/adherence/records/`
Create adherence record

**Permission:** Authenticated

### GET `/api/adherence/records/pending/`
Get pending adherence records

**Permission:** Authenticated

### GET `/api/adherence/records/overdue/`
Get overdue adherence records (over 1 hour late)

**Permission:** Authenticated

### POST `/api/adherence/respond/`
Record adherence response for a medication reminder

**Permission:** Authenticated

**Request Body:**
```json
{
    "reminder_id": 1,
    "status": "taken",
    "actual_time": "2025-01-01T08:05:00Z",
    "notes": "Took with breakfast"
}
```

**Status Options:** `taken`, `missed`, `skipped`

### GET `/api/adherence/summary/`
Get adherence summary statistics

**Permission:** Authenticated

**Response:**
```json
{
    "total_doses": 100,
    "taken_doses": 85,
    "missed_doses": 10,
    "skipped_doses": 5,
    "adherence_rate": 85.0,
    "current_streak": 5,
    "longest_streak": 15
}
```

### GET `/api/adherence/report/`
Get comprehensive adherence report with detailed analytics

**Permission:** Authenticated

**Query Parameters:**
- `days` (optional): Number of days to include in report (default: 30)

**Example:** `/api/adherence/report/?days=7`

**Response:**
```json
{
    "report_period": {
        "start_date": "2025-07-15",
        "end_date": "2025-08-15",
        "days_covered": 30
    },
    "overall_statistics": {
        "total_scheduled_doses": 90,
        "doses_taken": 78,
        "doses_missed": 8,
        "doses_skipped": 2,
        "pending_responses": 2,
        "overdue_responses": 1,
        "overall_adherence_rate": 88.6,
        "completion_rate": 97.8
    },
    "daily_adherence": [
        {
            "date": "2025-08-01",
            "taken": 3,
            "missed": 1,
            "skipped": 0,
            "pending": 0,
            "total": 4,
            "adherence_rate": 75.0
        }
    ],
    "medication_breakdown": [
        {
            "medication_id": 1,
            "medication_name": "Medication A",
            "total_doses": 30,
            "taken": 28,
            "missed": 2,
            "skipped": 0,
            "pending": 0,
            "adherence_rate": 93.3,
            "current_taken_streak": 5,
            "current_missed_streak": 0,
            "longest_taken_streak": 12,
            "longest_missed_streak": 3
        }
    ],
    "time_of_day_analysis": [
        {
            "hour": 8,
            "taken": 25,
            "missed": 3,
            "total": 28,
            "adherence_rate": 89.3
        }
    ],
    "weekly_trends": [
        {
            "week_number": 1,
            "week_start": "2025-08-08",
            "week_end": "2025-08-15",
            "total_doses": 21,
            "taken": 19,
            "adherence_rate": 90.5
        }
    ],
    "recent_missed_doses": [
        {
            "id": 1,
            "medication_name": "Medication A",
            "scheduled_time": "2025-08-14T08:00:00Z",
            "status": "missed"
        }
    ],
    "pending_responses": [
        {
            "id": 2,
            "medication_name": "Medication B",
            "scheduled_time": "2025-08-15T12:00:00Z",
            "status": "pending"
        }
    ],
    "insights": {
        "best_adherence_medication": "Medication A",
        "worst_adherence_medication": "Medication C", 
        "best_time_of_day": 8,
        "improvement_trend": "improving"
    }
}
```

### GET `/api/adherence/streaks/`
List adherence streaks

**Permission:** Authenticated

**Response:**
```json
[
    {
        "id": 1,
        "medication": {
            "id": 1,
            "name": "Medication Name"
        },
        "current_streak": 5,
        "longest_streak": 15,
        "last_taken": "2025-01-01T08:00:00Z",
        "streak_start_date": "2024-12-27T08:00:00Z"
    }
]
```

---

## Analytics

### GET `/api/analytics/summary/`
Get analytics summary

**Permission:** Authenticated

**Response:**
```json
{
    "total_reminders": 100,
    "sent_reminders": 95
}
```

---



## Data Models

### Medication
- `name`: String (required)
- `directions`: Text
- `side_effects`: Text
- `purpose`: Text
- `warnings`: Text
- `dosage_amount`: Decimal
- `dosage_unit`: Choice (mg, g, ml, pills)
- `notes`: Text
- `start_date`: Date
- `end_date`: Date (optional)
- `frequency`: String

### Schedule
- `medication`: Foreign Key to Medication
- `time_of_day`: Time
- `days_of_week`: String (comma-separated)
- `timezone`: String
- `active`: Boolean

### Reminder
- `schedule`: Foreign Key to Schedule
- `medication`: Foreign Key to Medication
- `scheduled_at`: DateTime
- `sent_at`: DateTime (optional)
- `status`: String (pending, sent, failed)

### AdherenceRecord
- `medication`: Foreign Key to Medication
- `reminder`: One-to-One to Reminder
- `status`: Choice (taken, missed, skipped, pending)
- `scheduled_time`: DateTime
- `actual_time`: DateTime (optional)
- `response_time`: DateTime (optional)
- `is_late`: Boolean
- `minutes_late`: Integer
- `notes`: Text

### AdherenceStreak
- `medication`: Foreign Key to Medication
- `current_streak`: Integer
- `longest_streak`: Integer
- `last_taken`: DateTime
- `streak_start_date`: Date

---

## Error Responses

### 400 Bad Request
```json
{
    "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
    "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
    "error": "Internal server error message"
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- All endpoints require authentication unless specified as "Public"
- Users can only access their own data
- Pagination is available on list endpoints
- All POST/PUT requests should include `Content-Type: application/json` header
- Date format: `YYYY-MM-DD`
- Time format: `HH:MM:SS`
- DateTime format: `YYYY-MM-DDTHH:MM:SSZ`
