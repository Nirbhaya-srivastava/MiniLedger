CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"friend_name" text NOT NULL,
	"amount" double precision NOT NULL,
	"due_date" text NOT NULL,
	"notes" text,
	"receipt_url" text,
	"is_repaid" boolean DEFAULT false NOT NULL,
	"repaid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"phone" text,
	"email" text,
	"display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
