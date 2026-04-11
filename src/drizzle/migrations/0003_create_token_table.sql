create table token (
    id text primary key,
    created text not null,
    website_ids text not null,
    last_used text,
    secret_hash text not null
);
