CREATE TABLE IF NOT EXISTS POSTS (
    post_id int unsigned NOT NULL,
    thread_id int unsigned NOT NULL,
    comment int unsigned NOT NULL,

    PRIMARY KEY (post_id)
);