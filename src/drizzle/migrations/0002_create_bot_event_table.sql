create table bot_event (
    id text primary key,
    created text not null,
    website_id text not null references website (id) on delete cascade,
    json not null
);
