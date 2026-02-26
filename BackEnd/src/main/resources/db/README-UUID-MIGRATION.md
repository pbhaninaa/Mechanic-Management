# UUID Migration - Database Reset

After migrating from numeric IDs to UUIDs, Hibernate cannot auto-convert existing tables because of foreign key constraints. You need to reset the database.

## Option 1: Run the migration script (recommended)

**From the BackEnd directory:**

```bash
mysql -u root -p < src/main/resources/db/migration-uuid-reset.sql
```

Or open MySQL Workbench / any MySQL client and run:

```sql
DROP DATABASE IF EXISTS mechdb;
CREATE DATABASE mechdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then start your Spring Boot application. Hibernate will create all tables with the new UUID schema.

## Option 2: One-time use `ddl-auto=create`

Temporarily in `application.properties` change:

```properties
spring.jpa.hibernate.ddl-auto=create
```

Start the app **once** so it drops and recreates all tables. Then change back to:

```properties
spring.jpa.hibernate.ddl-auto=update
```

---

**Note:** Both options **delete all existing data**. Re-register users and recreate test data after the reset.
