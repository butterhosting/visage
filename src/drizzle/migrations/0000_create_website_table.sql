create table website (
    id text primary key,
    created text not null,
    hostname text not null unique,
    has_data integer not null
);
