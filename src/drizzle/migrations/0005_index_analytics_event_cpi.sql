create index idx_analytics_event_client_page_id_not_null on analytics_event (client_page_id) where client_page_id is not null;
