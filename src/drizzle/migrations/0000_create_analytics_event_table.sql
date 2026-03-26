create table analytics_event (
    id text primary key,
    domain text not null,
    path text not null,
    referrer text,
    user_agent text not null,
    screen_width integer not null,
    screen_height integer not null,
    geo_city text,
    geo_country text,
    is_visitor integer not null,
);
