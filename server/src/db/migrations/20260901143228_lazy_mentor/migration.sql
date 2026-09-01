CREATE TYPE "account_role" AS ENUM('resident', 'guard', 'manager');--> statement-breakpoint
CREATE TYPE "approval_decision" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "approval_status" AS ENUM('pending', 'approved', 'declined', 'suspended', 'inactive');--> statement-breakpoint
CREATE TYPE "arrival_mode" AS ENUM('foot', 'vehicle', 'ride_hailing', 'taxi', 'public_transport', 'other');--> statement-breakpoint
CREATE TYPE "gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "guard_doc_type" AS ENUM('cv', 'proof_of_address', 'ni', 'dbs', 'driving_license', 'sia_badge');--> statement-breakpoint
CREATE TYPE "parcel_status" AS ENUM('collected', 'delivered', 'returned');--> statement-breakpoint
CREATE TYPE "salary_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "vehicle_doc_type" AS ENUM('registration_certificate', 'insurance_slip', 'maintenance_slip', 'mot_slip', 'road_tax_slip', 'petrol_slip');--> statement-breakpoint
CREATE TYPE "vehicle_owner_type" AS ENUM('resident', 'company');--> statement-breakpoint
CREATE TYPE "vehicle_type" AS ENUM('bike', 'car', 'scooter', 'van', 'truck', 'other');--> statement-breakpoint
CREATE TYPE "visit_status" AS ENUM('pending', 'approved', 'active', 'completed', 'cancelled', 'rejected');--> statement-breakpoint
CREATE TYPE "work_status" AS ENUM('scheduled', 'completed', 'absent', 'late', 'cancelled');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"role" "account_role" NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"email" varchar NOT NULL UNIQUE,
	"phone" varchar(20) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"approval_status" "approval_status" DEFAULT 'pending'::"approval_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guard_profiles" (
	"account_id" uuid PRIMARY KEY,
	"employee_code" varchar(20) NOT NULL UNIQUE,
	"date_of_birth" date NOT NULL,
	"home_address" varchar(255) NOT NULL,
	"emergency_contact" varchar(20) NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"bank_account_number" varchar(20) NOT NULL,
	"bank_sort_code" varchar(6) NOT NULL,
	"work_experience" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "house_members" (
	"account_id" uuid PRIMARY KEY,
	"house_id" uuid NOT NULL,
	"is_primary_resident" boolean NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" "gender" NOT NULL,
	"whatsapp_number" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"emergency_contact" varchar(20),
	CONSTRAINT "date_of_birth_check" CHECK ("date_of_birth" < CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "manager_profiles" (
	"account_id" uuid PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guard_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"guard_id" uuid NOT NULL,
	"doc_type" "guard_doc_type" NOT NULL,
	"file_url" varchar NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" date
);
--> statement-breakpoint
CREATE TABLE "guard_salary_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"guard_id" uuid NOT NULL,
	"period_start_date" date NOT NULL,
	"period_end_date" date NOT NULL,
	"requested_shift_count" smallint NOT NULL,
	"requested_amount" numeric(10,2) NOT NULL,
	"status" "salary_request_status" DEFAULT 'pending'::"salary_request_status" NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by_manager_id" uuid,
	"approved_at" timestamp with time zone,
	"notes" varchar(255),
	CONSTRAINT "salary_request_period_check" CHECK ("period_end_date" >= "period_start_date"),
	CONSTRAINT "requested_shift_count_positive_check" CHECK ("requested_shift_count" > 0),
	CONSTRAINT "requested_amount_positive_check" CHECK ("requested_amount" > 0),
	CONSTRAINT "approval_check" CHECK (
           (
             "status" = 'pending'
             AND "approved_by_manager_id" IS NULL
             AND "approved_at" IS NULL
           )
           OR
           (
             "status" IN ('approved', 'rejected')
             AND "approved_by_manager_id" IS NOT NULL
             AND "approved_at" IS NOT NULL
           )
         )
);
--> statement-breakpoint
CREATE TABLE "guard_salary_slip_items" (
	"id" serial PRIMARY KEY,
	"salary_slip_id" uuid NOT NULL,
	"guard_schedule_id" uuid NOT NULL,
	"amount" numeric(10,2) NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amount_positive_check" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "guard_salary_slips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"generated_by_manager_id" uuid NOT NULL,
	"guard_id" uuid NOT NULL,
	"period_start_date" date NOT NULL,
	"period_end_date" date NOT NULL,
	"total_shifts" smallint NOT NULL,
	"total_amount" numeric(10,2) NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"salary_request_id" uuid UNIQUE,
	"notes" varchar(255),
	CONSTRAINT "salary_slip_period_check" CHECK ("period_end_date" >= "period_start_date"),
	CONSTRAINT "total_shifts_positive_check" CHECK ("total_shifts" > 0),
	CONSTRAINT "total_amount_positive_check" CHECK ("total_amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "guard_attendances" (
	"guard_schedule_id" uuid PRIMARY KEY,
	"check_in_at" time NOT NULL,
	"break_start_at" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"check_out_at" time,
	"break_end_at" time,
	"notes" varchar(255),
	CONSTRAINT "check_in_out_time_check" CHECK ("check_in_at" < "check_out_at"),
	CONSTRAINT "break_time_check" CHECK ("break_start_at" < "break_end_at")
);
--> statement-breakpoint
CREATE TABLE "guard_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"guard_id" uuid NOT NULL,
	"is_manual" boolean NOT NULL,
	"week_start_date" date NOT NULL,
	"shift_date" date NOT NULL,
	"shift_id" serial,
	"shift_no" smallint NOT NULL,
	"shift_start_time" time NOT NULL,
	"shift_end_time" time NOT NULL,
	"zone_id" uuid NOT NULL,
	"rate" numeric(10,2) NOT NULL,
	"status" "work_status" NOT NULL,
	"assigned_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "guest_visit_approvals" (
	"guest_visit_id" uuid PRIMARY KEY,
	"decision" "approval_decision" DEFAULT 'pending'::"approval_decision" NOT NULL,
	"decided_by_account_id" uuid,
	"decided_at" timestamp,
	"notes" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "guest_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"recorded_by_guard_account_id" uuid NOT NULL,
	"host_house_id" uuid NOT NULL,
	"host_member_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"street_id" uuid NOT NULL,
	"guest_name" varchar(255) NOT NULL,
	"guest_count" smallint NOT NULL,
	"arrival_mode" "arrival_mode" NOT NULL,
	"arrived_at" timestamp NOT NULL,
	"visit_status" "visit_status" DEFAULT 'pending'::"visit_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"vehicle_type" "vehicle_type",
	"vehicle_registration" varchar(20),
	"purpose" varchar(255),
	"departed_at" timestamp,
	"notes" varchar(255),
	CONSTRAINT "guest_count_positive_check" CHECK ("guest_count" > 0),
	CONSTRAINT "vehicle_type_vehicle_registration_check" CHECK (
        (
          "vehicle_type" IS NOT NULL
          AND "vehicle_registration" IS NOT NULL
        )
        OR
        (
          "vehicle_type" IS NULL
          AND "vehicle_registration" IS NULL
        )
        ),
	CONSTRAINT "departed_at_after_arrived_at_check" CHECK (
        "departed_at" IS NULL
        OR "departed_at" >= "arrived_at"
      ),
	CONSTRAINT "arrival_mode_vehicle_fields_check" CHECK (
        (
          "arrival_mode" = 'vehicle'
          AND "vehicle_type" IS NOT NULL
          AND "vehicle_registration" IS NOT NULL
        )
        OR
        (
          "arrival_mode" <> 'vehicle'
          AND "vehicle_type" IS NULL
          AND "vehicle_registration" IS NULL
        )
      )
);
--> statement-breakpoint
CREATE TABLE "houses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"zone_id" uuid NOT NULL,
	"street_id" uuid NOT NULL,
	"house_number" integer NOT NULL,
	"house_name" varchar(255) NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "house_number_positive" CHECK ("house_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "streets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"zone_id" uuid NOT NULL,
	"street_number" smallint NOT NULL,
	"name" varchar(255) NOT NULL,
	"postcode" varchar(20) NOT NULL,
	"wkt" text NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "street_number_positive" CHECK ("street_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"rate" numeric NOT NULL,
	"name" varchar(255) NOT NULL UNIQUE,
	"postcode" varchar(20) NOT NULL,
	"wkt" text NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zone_rate_positive" CHECK ("rate" > 0)
);
--> statement-breakpoint
CREATE TABLE "parcel_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"collected_by_guard_id" uuid NOT NULL,
	"house_id" uuid NOT NULL,
	"received_for_member_id" uuid NOT NULL,
	"parcel_count" smallint NOT NULL,
	"description" text,
	"photo_url" varchar NOT NULL,
	"status" "parcel_status" DEFAULT 'collected'::"parcel_status" NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parcel_count_positive" CHECK ("parcel_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY,
	"shift_no" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_current" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shift_no_positive_check" CHECK ("shift_no" > 0),
	CONSTRAINT "shift_time_check" CHECK ("end_time" > "start_time")
);
--> statement-breakpoint
CREATE TABLE "vehicle_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vehicle_id" uuid NOT NULL,
	"document_type" "vehicle_doc_type" NOT NULL,
	"document_date" date NOT NULL,
	"file_url" varchar(255) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fuel_price" numeric,
	"notes" varchar(255),
	CONSTRAINT "fuel_price_only_for_petrol_slip" CHECK (
        (
          "document_type" = 'petrol_slip'
          AND "fuel_price" IS NOT NULL
        )
        OR
        (
          "document_type" <> 'petrol_slip'
          AND "fuel_price" IS NULL
        )
      )
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" uuid NOT NULL,
	"owner_type" "vehicle_owner_type" NOT NULL,
	"vehicle_type" "vehicle_type" NOT NULL,
	"make" varchar(50) NOT NULL,
	"model" varchar(50) NOT NULL,
	"registration_number" varchar(20) NOT NULL,
	"image_url" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"house_id" uuid,
	"parking_post_code" varchar(10),
	CONSTRAINT "vehicles_house_id_check" CHECK (
          (
            "owner_type" = 'resident'
            AND "house_id" IS NOT NULL
          )
          OR
          (
            "owner_type" = 'company'
            AND "house_id" IS NULL
          )
        )
);
--> statement-breakpoint
CREATE INDEX "house_members_house_id_idx" ON "house_members" ("house_id");--> statement-breakpoint
CREATE INDEX "guard_documents_guard_id_idx" ON "guard_documents" ("guard_id");--> statement-breakpoint
CREATE INDEX "guard_salary_requests_guard_id_idx" ON "guard_salary_requests" ("guard_id");--> statement-breakpoint
CREATE INDEX "guard_salary_requests_status_idx" ON "guard_salary_requests" ("status");--> statement-breakpoint
CREATE INDEX "guard_salary_slip_items_salary_slip_id_idx" ON "guard_salary_slip_items" ("salary_slip_id");--> statement-breakpoint
CREATE INDEX "guard_salary_slip_items_guard_schedule_id_idx" ON "guard_salary_slip_items" ("guard_schedule_id");--> statement-breakpoint
CREATE INDEX "guard_salary_slips_guard_id_idx" ON "guard_salary_slips" ("guard_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guard_salary_slips_salary_request_id_idx" ON "guard_salary_slips" ("salary_request_id");--> statement-breakpoint
CREATE INDEX "guard_schedules_guard_id_idx" ON "guard_schedules" ("guard_id");--> statement-breakpoint
CREATE INDEX "guard_schedules_zone_id_idx" ON "guard_schedules" ("zone_id");--> statement-breakpoint
CREATE INDEX "guard_schedules_shift_date_idx" ON "guard_schedules" ("shift_date");--> statement-breakpoint
CREATE INDEX "guard_schedules_status_idx" ON "guard_schedules" ("status");--> statement-breakpoint
CREATE INDEX "guest_visits_recorded_by_guard_idx" ON "guest_visits" ("recorded_by_guard_account_id");--> statement-breakpoint
CREATE INDEX "guest_visits_host_house_id_idx" ON "guest_visits" ("host_house_id");--> statement-breakpoint
CREATE INDEX "guest_visits_zone_id_idx" ON "guest_visits" ("zone_id");--> statement-breakpoint
CREATE INDEX "guest_visits_street_id_idx" ON "guest_visits" ("street_id");--> statement-breakpoint
CREATE INDEX "guest_visits_status_idx" ON "guest_visits" ("visit_status");--> statement-breakpoint
CREATE INDEX "houses_zone_id_idx" ON "houses" ("zone_id");--> statement-breakpoint
CREATE INDEX "houses_street_id_idx" ON "houses" ("street_id");--> statement-breakpoint
CREATE UNIQUE INDEX "street_name_per_zone_idx" ON "streets" ("zone_id","name");--> statement-breakpoint
CREATE INDEX "parcel_collections_collected_by_guard_id_idx" ON "parcel_collections" ("collected_by_guard_id");--> statement-breakpoint
CREATE INDEX "parcel_collections_house_id_idx" ON "parcel_collections" ("house_id");--> statement-breakpoint
CREATE INDEX "parcel_collections_received_for_member_id_idx" ON "parcel_collections" ("received_for_member_id");--> statement-breakpoint
CREATE INDEX "vehicle_documents_vehicle_id_idx" ON "vehicle_documents" ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicles_owner_id_idx" ON "vehicles" ("owner_id");--> statement-breakpoint
CREATE INDEX "vehicles_house_id_idx" ON "vehicles" ("house_id");--> statement-breakpoint
ALTER TABLE "guard_profiles" ADD CONSTRAINT "guard_profiles_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_house_id_houses_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id");--> statement-breakpoint
ALTER TABLE "manager_profiles" ADD CONSTRAINT "manager_profiles_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "guard_documents" ADD CONSTRAINT "guard_documents_guard_id_guard_profiles_account_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "guard_profiles"("account_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guard_salary_requests" ADD CONSTRAINT "guard_salary_requests_guard_id_guard_profiles_account_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "guard_profiles"("account_id");--> statement-breakpoint
ALTER TABLE "guard_salary_requests" ADD CONSTRAINT "guard_salary_requests_aUtU2ZsB8DoI_fkey" FOREIGN KEY ("approved_by_manager_id") REFERENCES "manager_profiles"("account_id");--> statement-breakpoint
ALTER TABLE "guard_salary_slip_items" ADD CONSTRAINT "guard_salary_slip_items_eqdZVyWeHw1n_fkey" FOREIGN KEY ("salary_slip_id") REFERENCES "guard_salary_slips"("id");--> statement-breakpoint
ALTER TABLE "guard_salary_slip_items" ADD CONSTRAINT "guard_salary_slip_items_iBys9CO5tnVx_fkey" FOREIGN KEY ("guard_schedule_id") REFERENCES "guard_schedules"("id");--> statement-breakpoint
ALTER TABLE "guard_salary_slips" ADD CONSTRAINT "guard_salary_slips_g85w0xhln1wd_fkey" FOREIGN KEY ("generated_by_manager_id") REFERENCES "manager_profiles"("account_id");--> statement-breakpoint
ALTER TABLE "guard_salary_slips" ADD CONSTRAINT "guard_salary_slips_guard_id_guard_profiles_account_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "guard_profiles"("account_id");--> statement-breakpoint
ALTER TABLE "guard_salary_slips" ADD CONSTRAINT "guard_salary_slips_8Zf7Nbc7ODjH_fkey" FOREIGN KEY ("salary_request_id") REFERENCES "guard_salary_requests"("id");--> statement-breakpoint
ALTER TABLE "guard_attendances" ADD CONSTRAINT "guard_attendances_guard_schedule_id_guard_schedules_id_fkey" FOREIGN KEY ("guard_schedule_id") REFERENCES "guard_schedules"("id");--> statement-breakpoint
ALTER TABLE "guard_schedules" ADD CONSTRAINT "guard_schedules_guard_id_guard_profiles_account_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "guard_profiles"("account_id");--> statement-breakpoint
ALTER TABLE "guard_schedules" ADD CONSTRAINT "guard_schedules_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id");--> statement-breakpoint
ALTER TABLE "guard_schedules" ADD CONSTRAINT "guard_schedules_zone_id_zones_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id");--> statement-breakpoint
ALTER TABLE "guard_schedules" ADD CONSTRAINT "guard_schedules_assigned_by_id_manager_profiles_account_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "manager_profiles"("account_id");--> statement-breakpoint
ALTER TABLE "guest_visit_approvals" ADD CONSTRAINT "guest_visit_approvals_guest_visit_id_guest_visits_id_fkey" FOREIGN KEY ("guest_visit_id") REFERENCES "guest_visits"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guest_visit_approvals" ADD CONSTRAINT "guest_visit_approvals_decided_by_account_id_accounts_id_fkey" FOREIGN KEY ("decided_by_account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "guest_visits" ADD CONSTRAINT "guest_visits_j2155pIR9K3F_fkey" FOREIGN KEY ("recorded_by_guard_account_id") REFERENCES "guard_profiles"("account_id");--> statement-breakpoint
ALTER TABLE "guest_visits" ADD CONSTRAINT "guest_visits_host_house_id_houses_id_fkey" FOREIGN KEY ("host_house_id") REFERENCES "houses"("id");--> statement-breakpoint
ALTER TABLE "guest_visits" ADD CONSTRAINT "guest_visits_host_member_id_house_members_account_id_fkey" FOREIGN KEY ("host_member_id") REFERENCES "house_members"("account_id");--> statement-breakpoint
ALTER TABLE "guest_visits" ADD CONSTRAINT "guest_visits_zone_id_zones_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id");--> statement-breakpoint
ALTER TABLE "guest_visits" ADD CONSTRAINT "guest_visits_street_id_streets_id_fkey" FOREIGN KEY ("street_id") REFERENCES "streets"("id");--> statement-breakpoint
ALTER TABLE "houses" ADD CONSTRAINT "houses_zone_id_zones_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id");--> statement-breakpoint
ALTER TABLE "houses" ADD CONSTRAINT "houses_street_id_streets_id_fkey" FOREIGN KEY ("street_id") REFERENCES "streets"("id");--> statement-breakpoint
ALTER TABLE "streets" ADD CONSTRAINT "streets_zone_id_zones_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id");--> statement-breakpoint
ALTER TABLE "parcel_collections" ADD CONSTRAINT "parcel_collections_CdYbrBKe0FfQ_fkey" FOREIGN KEY ("collected_by_guard_id") REFERENCES "guard_profiles"("account_id");--> statement-breakpoint
ALTER TABLE "parcel_collections" ADD CONSTRAINT "parcel_collections_house_id_houses_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id");--> statement-breakpoint
ALTER TABLE "parcel_collections" ADD CONSTRAINT "parcel_collections_ajeAhEWpNqnB_fkey" FOREIGN KEY ("received_for_member_id") REFERENCES "house_members"("account_id");--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_owner_id_accounts_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_house_id_houses_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id");