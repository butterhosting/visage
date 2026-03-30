create table bot_event (
    id text primary key,
    website_id text not null references website (id),
    json not null
);
