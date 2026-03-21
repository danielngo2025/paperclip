CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"source" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"category" text DEFAULT 'ecosystem' NOT NULL,
	"entities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lane" text,
	"author" text,
	"novelty_score" real,
	"impact_score" real,
	"relevance_score" real,
	"authority_score" real,
	"composite_score" real,
	"published_at" timestamp with time zone,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_briefings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"date" date NOT NULL,
	"markdown_content" text NOT NULL,
	"total_collected" integer DEFAULT 0 NOT NULL,
	"total_selected" integer DEFAULT 0 NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_briefings" ADD CONSTRAINT "news_briefings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_briefings" ADD CONSTRAINT "news_briefings_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_articles_company_agent_idx" ON "news_articles" USING btree ("company_id","agent_id");--> statement-breakpoint
CREATE INDEX "news_articles_company_category_idx" ON "news_articles" USING btree ("company_id","category");--> statement-breakpoint
CREATE INDEX "news_articles_collected_at_idx" ON "news_articles" USING btree ("collected_at");--> statement-breakpoint
CREATE INDEX "news_briefings_company_date_idx" ON "news_briefings" USING btree ("company_id","date");--> statement-breakpoint
CREATE INDEX "news_briefings_company_agent_idx" ON "news_briefings" USING btree ("company_id","agent_id");