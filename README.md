# KwiK — URL Shortening Platform with Analytics

## Overview

KwiK is a full-stack URL shortening platform designed to provide low-latency URL redirection while collecting click analytics without impacting user response time. The system separates the user-facing redirect path from background analytics processing to ensure redirects remain fast even under heavy traffic.

The application supports OAuth-based authentication, URL management, click tracking, geo-location enrichment, and analytics through a combination of PostgreSQL, Redis, and asynchronous workers.

---

# Problem Statement

A URL shortening service must satisfy two conflicting requirements:

* Redirect users with minimal latency.
* Collect detailed analytics for every click.

Performing analytics, IP lookups, and database updates synchronously increases redirect latency and reduces throughput. The objective of this project was to design a system where analytics collection never delays the user's redirect experience.

---

# Solution

The redirect path performs only the operations required to return the destination URL.

When a user accesses a shortened link:

1. The application checks Redis for the cached URL.
2. If unavailable, the URL is retrieved from PostgreSQL and cached.
3. The click event is immediately stored in PostgreSQL.
4. A geo-enrichment job containing only the Event ID and client IP is published to a Redis Stream.
5. The user is redirected immediately.

A background worker continuously consumes geo-enrichment jobs, retrieves location information from the external IP service, and updates the corresponding analytics record.

Because geo-location processing occurs asynchronously, external API latency never affects redirect performance.

---

# System Design

```
                    User
                      │
                      ▼
               FastAPI Redirect API
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
     Redis Cache            PostgreSQL
          │                       │
          └───────────┬───────────┘
                      │
                Click Event
                      │
                      ▼
                Redis Stream
                      │
                      ▼
               Geo Worker Service
                      │
                      ▼
                 ip-api.com
                      │
                      ▼
                PostgreSQL Update
```

---

# Key Features

* Google and GitHub OAuth authentication
* JWT-based authorization
* URL shortening using Base62 encoding
* URL creation, editing, deletion and status management
* Redis-based caching for low-latency redirects
* Click analytics for every redirect
* Asynchronous geo-location enrichment
* User dashboard with analytics
* Docker-based deployment

---

# Design Decisions

### Redis Cache

Frequently accessed URLs are cached in Redis to reduce database lookups and improve redirect latency.

---

### PostgreSQL as Source of Truth

All persistent application data, including users, URLs, and click analytics, is stored in PostgreSQL. Redis is treated only as a performance optimization layer.

---

### Asynchronous Geo Processing

Geo-location lookup requires communication with an external API that has strict rate limits and unpredictable response times.

Instead of performing this operation during the redirect request, the application publishes a lightweight event to a Redis Stream. A background worker processes these events independently and updates the analytics record after the redirect has already completed.

This approach keeps redirect latency consistently low while allowing analytics to be enriched later.

---

### Rate-Limited External Requests

The geo worker limits requests to the external IP service to remain within the provider's free-tier quota. Requests exceeding the limit remain queued inside Redis Streams until they are processed.

---

# Scalability Considerations

The application is designed around independent components that can be scaled individually.

* Multiple API instances can serve redirect requests.
* Redis handles URL caching and event buffering.
* Additional geo workers can be introduced when using a higher-rate geo-location provider.
* PostgreSQL remains the authoritative datastore for all business data.

This separation allows redirect traffic and background processing to scale independently.

---

# Technology Stack

### Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* Redis
* Redis Streams

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Authentication

* Google OAuth
* GitHub OAuth
* JWT

### Deployment

* Docker
* Railway
* Vercel

---

# Future Enhancements

* Custom aliases
* QR code generation
* Link expiration
* Bulk URL creation
* Rate limiting per user
* Click analytics dashboard
* Kafka integration for distributed event processing
* Redis Cluster support for higher throughput

---

# Conclusion

KwiK demonstrates the design of a production-oriented URL shortening service where user-facing operations remain lightweight while analytics processing is delegated to asynchronous workers. By combining Redis caching, Redis Streams, PostgreSQL, and background processing, the system maintains fast redirect performance while supporting reliable analytics collection and future scalability.
