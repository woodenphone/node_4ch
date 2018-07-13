CREATE TABLE IF NOT EXISTS "posts" (
  "doc_id" int unsigned NOT NULL ,-- UNKNOWN USAGE
  "media_id" int unsigned NOT NULL DEFAULT '0',
  "poster_ip" decimal(39,0) NOT NULL DEFAULT '0',
  "num" int unsigned NOT NULL,-- Maybe post ID number?
  "subnum" int unsigned NOT NULL,-- UNKNOWN USAGE
  "thread_num" int unsigned NOT NULL DEFAULT '0',-- Post ID number of thread OP?
  "op" bool NOT NULL DEFAULT '0',-- Is this a thread OP post?
  "timestamp" int unsigned NOT NULL,-- Unknown tyme system
  "timestamp_expired" int unsigned NOT NULL,-- Unknown tyme system
  "preview_orig" varchar(20),
  "preview_w" smallint unsigned NOT NULL DEFAULT '0',
  "preview_h" smallint unsigned NOT NULL DEFAULT '0',
  "media_filename" text,-- Filename of image
  "media_w" smallint unsigned NOT NULL DEFAULT '0',
  "media_h" smallint unsigned NOT NULL DEFAULT '0',
  "media_size" int unsigned NOT NULL DEFAULT '0',
  "media_hash" varchar(25),-- MD5 hash of post's image encoded into base64
  "media_orig" varchar(20),
  "spoiler" bool NOT NULL DEFAULT '0',
  "deleted" bool NOT NULL DEFAULT '0',
  "capcode" varchar(1) NOT NULL DEFAULT 'N',
  "email" varchar(100),
  "name" varchar(100),
  "trip" varchar(25),
  "title" varchar(100),
  "comment" text,-- Post text
  "delpass" tinytext,
  "sticky" bool NOT NULL DEFAULT '0',
  "locked" bool NOT NULL DEFAULT '0',
  "poster_hash" varchar(8),
  "poster_country" varchar(2),
  "exif" text,

  PRIMARY KEY ("doc_id"),
  )