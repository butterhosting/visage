create index idx_analytics_event_website_id_created on analytics_event (website_id, created);
--> statement-breakpoint
create index idx_analytics_event_client_page_id_not_null on analytics_event (client_page_id) where client_page_id is not null;
