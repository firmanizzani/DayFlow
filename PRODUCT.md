# DailyFlow

Product name in the specification: Dayflow. Personal Android/iOS productivity planner for students, workers and freelancers.

Capture → organize → schedule → focus → complete → reflect. Tasks and time blocks are separate records. All features in prompt.md are in the release scope; prompt.md takes precedence over PRD phase labels.

Native React Native/Expo client, Spring Boot REST backend, PostgreSQL/Neon, no Docker. No AI, payments or collaboration. Backend is the source of truth; never display fabricated tasks or analytics.

User decision (18 November 2026): replace the original UUID primary key requirement
with sequential numeric IDs. Each table uses its own PostgreSQL BIGINT identity,
with an entity-specific primary key name such as user_id or task_id. Deleted IDs
are not reused; gaps are valid. API IDs remain decimal strings for JavaScript
precision. Focus clientId and diagnostic request IDs remain UUIDs.
