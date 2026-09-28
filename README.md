# event-booking-service

Layered Node.js booking service scaffold.

## Architecture

This service follows a layered architecture with separate routes, controllers, services, models, middleware, and configuration modules.

## Run

1. npm install
2. npm start

## Inter-service Communication (via API Gateway)

This service calls other services only through the API gateway base URL.

Base URL:

- API_GATEWAY_URL

Default downstream paths used by this service:

- users: `/users/{userId}`
- events: `/events/{eventId}`
- payments (charge): `/payments`
- payments (refund): `/payments/refund`

Environment variables:

- `API_GATEWAY_URL=http://localhost:8086`
- `GATEWAY_TIMEOUT_MS=5000`
- `GATEWAY_USER_LOOKUP_PATH=/users/{userId}`
- `GATEWAY_EVENT_LOOKUP_PATH=/events/{eventId}`
- `GATEWAY_PAYMENT_CHARGE_PATH=/payments`
- `GATEWAY_PAYMENT_REFUND_PATH=/payments/refund`

`{userId}` and `{eventId}` placeholders are replaced at runtime.

## Microservice ecosystem

This service is part of the Event Booking platform:

- [Event API Gateway](https://github.com/hasindu-k/event-api-gateway) — request routing, authentication, and API documentation
- [Event Booking Service](https://github.com/hasindu-k/event-booking-service) — booking management
- [Event Service](https://github.com/OshadiJayananda/event-ticket-event-service) — event management
- [User Service](https://github.com/Miyuri15/event-booking-user-service) — user accounts and authentication
- [Payment Service](https://github.com/IT22362476/Event-Booking-paymentservice) — payment processing

The API gateway routes client requests to this service and the other appropriate downstream services.

## Frontend application

- [Event Booking Frontend](https://github.com/Miyuri15/event-booking-frontend) — web client for browsing events, managing bookings, and interacting with the platform through this gateway
- **Live frontend:** [lumaevents.vercel.app](https://lumaevents.vercel.app/)
