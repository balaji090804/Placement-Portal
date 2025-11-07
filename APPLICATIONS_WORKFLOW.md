# Applications & Shortlist Workflow

This portal implements a Creatix-like placement pipeline with Drives, Applications, Interviews, and Offers.

## Entities

- Drive: Status lifecycle = Draft → Published → ApplicationsOpen → Shortlisting → Interviews → Offers → Closed
- Application: Statuses = Applied, Eligible, Shortlisted, Rejected, InterviewScheduled, Offered, Joined
- InterviewSlot: A capacity-based slot for a drive that students can book
- Offer: Status lifecycle = Draft → Released → Accepted/Declined/Expired
- Notification: In-app notifications per user

## APIs

- Drives: `GET/POST/PUT /api/drives`, `POST /api/drives/:id/transition`
- Applications: `GET /api/applications`, `POST /api/applications/apply`, `PATCH /api/applications/:id/status`, `GET /api/applications/analytics`, `GET /api/applications/export/csv`
- Interview slots: `GET /api/interview-slots`, `POST /api/interview-slots`, `POST /api/interview-slots/:id/book`, `POST /api/interview-slots/:id/cancel`
- Offers: `GET/POST/PUT /api/offers`, `POST /api/offers/:id/accept`, `POST /api/offers/:id/decline`
- Notifications: `GET /api/notifications`, `POST /api/notifications/:id/read`

## UI

- Admin
  - AdminDrives: create + lifecycle transitions
  - AdminApplications: shortlist/status transitions + history
  - AdminPipelineAnalytics: funnel per status
  - AdminOffers: create/release offers
- Student
  - UpcomingDrives: list drives + Apply via /api/applications
  - Applications: track application statuses
  - InterviewSlots: book/cancel interview slots
  - Offers: accept/decline released offers
  - Notifications: unread notifications list

## Eligibility checks

- Applications: require ApplicationsOpen, within window, and a completed student profile

## Real-time

- Socket.IO emits `dashboard:update` on changes and `notification:new` to user rooms
- Presence: `/api/presence` lists emails online (in-memory for now)

## Export

- CSV export of Applications: `GET /api/applications/export/csv?driveId=<optional>`
