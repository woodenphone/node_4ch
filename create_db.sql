CREATE TABLE IF NOT EXISTS posts (
    primary_key integer PRIMARY KEY,
    post_id int unsigned NOT NULL,
    thread_id int unsigned NOT NULL,
    comment int unsigned NOT NULL
);