# Event Management API

## Overview

This API provides endpoints for managing events, including creating, retrieving, joining, and canceling bookings for events. It is built using Node.js and PostgreSQL.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- PostgreSQL database

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/Abhiram86/event-management-api.git
   cd event-management-api
   ```

2. **Create a `.env` File:**
   In the root directory of the project, create a file named `.env` and add the following line:

   ```plaintext
   DATABASE_URI="FILL THIS"
   ```

   Replace `"FILL THIS"` with your PostgreSQL connection string from any cloud PostgreSQL provider.

3. **Install Dependencies:**
   Run the following command to install the required packages:

   ```bash
   npm install
   ```

4. **Run the Application:**
   Start the server in development mode:
   ```bash
   npm run dev
   ```

## Endpoints

### 1. Get Events

**Endpoint:** `GET /events`

**Query Parameters:**

- `sortBy` (optional):
  - `asc`: Sort events in ascending order by start date.
  - `desc`: Sort events in descending order by start date.
  - `location`: Sort events by location.

**Response:**

- Returns a list of upcoming events.

### 2. Get Event by ID

**Endpoint:** `GET /events/:event_id`

**Path Parameters:**

- `event_id`: The ID of the event to retrieve.

**Query Parameters:**

- `users` (optional): If set, includes a list of users who have booked the event.

**Response:**

- Returns details of the specified event, including booked count, remaining capacity, and percentage of capacity used.

### 3. Create New Event

**Endpoint:** `POST /events`

**Request Body:**

```json
{
  "title": "Event Title",
  "starts_at": "YYYY-MM-DDTHH:MM:SSZ",
  "location": "Event Location",
  "capacity": 100
}
```

**Response:**

- Returns a success message if the event is created successfully.

### 4. Join Event

**Endpoint:** `POST /events/:event_id/join`

**Path Parameters:**

- `event_id`: The ID of the event to join.

**Request Body:**

```json
{
  "user_id": 1
}
```

**Response:**

- Returns a success message if the user successfully joins the event.

### 5. Cancel Booking

**Endpoint:** `DELETE /events/:event_id/cancel`

**Path Parameters:**

- `event_id`: The ID of the event for which the booking is to be canceled.

**Request Body:**

```json
{
  "user_id": 1
}
```

**Response:**

- Returns a success message if the booking is canceled successfully.

## Load Testing

The API was tested using a Go script to simulate concurrent requests for joining an event. Below are the results from the load test:

```go
// Load Test Results
// Total Requests: 300
// Success (200): 194
// Conflict (409): 106
// Failures: 0
// Time Taken: 2m28.3080954s
```

### Example of Event Details Response

When retrieving an event with ID 3, the response was as follows:

```json
{
  "id": 3,
  "title": "new",
  "starts_at": "2025-09-14T11:02:47.000Z",
  "location": "Mumbai",
  "capacity": 200,
  "booked": 6,
  "remaining": 194,
  "percentCapacity": 3
}
```

## Error Handling

- **400 Bad Request**: Returned when required parameters are missing or invalid.
- **404 Not Found**: Returned when an event or booking is not found.
- **409 Conflict**: Returned when a user tries to book an event that is already full or has already been booked.

## Conclusion

This API provides a robust solution for managing events and bookings. It is designed to handle multiple concurrent requests efficiently, ensuring a smooth user experience.
