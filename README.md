Assignment: Database Access

Course: Complex IT Systems – Theory E2026 (40417), Roskilde University
Group members: Christian, Sandra and Sigurd

Solutions to the database access assignment using TypeScript and PostgreSQL.

Small reflection:
For us, buisness logic is easier to read, test, and maintain when it is kept together in TypeScript. The downside is that 
this approach requres multiple database calls, which can add latency, and we must explicitly manage the transaction using 
BEGIN, COMMIT and ROLLBACK. With a stored procedure, the logic runs inside the database thriugh a single call from TypeScript, 
reducing commmunication between the appilication environment, which is less familiar to us. We would therefore keep the 
buisness logic in TypeScipt, as this course does, because we find it easier to maintain, while accepting the additional 
database calls and responsibility and transaction management.
