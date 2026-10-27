ALTER TABLE "zones" DROP CONSTRAINT "zones_name_key";--> statement-breakpoint
ALTER TABLE "zones" ALTER COLUMN "rate" SET DATA TYPE numeric(10,2) USING "rate"::numeric(10,2);--> statement-breakpoint
CREATE UNIQUE INDEX "zones_name_lower_idx" ON "zones" (lower("name"));