create table website (
    id text primary key,
    created text not null,
    hostname text not null unique
);
