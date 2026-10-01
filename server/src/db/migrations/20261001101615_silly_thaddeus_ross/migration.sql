ALTER TABLE "accounts" ALTER COLUMN "approval_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "approval_status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "approval_status";--> statement-breakpoint
CREATE TYPE "approval_status" AS ENUM('pending', 'approved', 'suspended');--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "approval_status" SET DATA TYPE "approval_status" USING "approval_status"::"approval_status";--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "approval_status" SET DEFAULT 'pending'::"approval_status";