DROP INDEX "house_members_house_id_idx";--> statement-breakpoint
ALTER TABLE "guest_visits" ALTER COLUMN "arrived_at" SET DATA TYPE timestamp with time zone USING "arrived_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "houses" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "streets" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "zones" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
CREATE UNIQUE INDEX "house_members_one_primary_per_house_idx" ON "house_members" ("house_id") WHERE "is_primary_resident";--> statement-breakpoint
CREATE UNIQUE INDEX "houses_street_house_number_uniq" ON "houses" ("street_id","house_number");