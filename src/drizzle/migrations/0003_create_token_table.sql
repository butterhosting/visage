create table token (
    id text primary key,
    created text not null,
    websites text not null,
    last_used text,
    secret_hash text not null
);
