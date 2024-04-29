CREATE DATABASE IF NOT EXISTS example;
USE example;

CREATE TABLE IF NOT EXISTS country
(
   country_code        varchar(4)                             NOT NULL PRIMARY KEY
  ,name                varchar(50)                            NULL
  ,long_name           varchar(255)                           NULL
  ,has_states          tinyint(1)   DEFAULT 0                 NULL
  ,require_postal_code tinyint(1)   DEFAULT 0                 NULL
  ,show_postal_code    tinyint(1)   DEFAULT 0                 NULL
  ,is_active           tinyint(1)   DEFAULT 1                 NULL
  ,phone_code          varchar(10)                            NULL
  ,created_on          timestamp    DEFAULT CURRENT_TIMESTAMP NULL
  ,created_by          varchar(50)                            NULL
  ,modified_by         varchar(50)                            NULL
  ,modified_on         timestamp    DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS country_state
(
   country_code varchar(4)                            NOT NULL
  ,state_code   varchar(4)                            NOT NULL
  ,name         varchar(50)                           NULL
  ,created_on   timestamp   DEFAULT CURRENT_TIMESTAMP NULL
  ,created_by   varchar(50)                           NULL
  ,modified_by  varchar(50)                           NULL
  ,modified_on  timestamp   DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

alter table country_state
    add primary key (country_code,state_code);


CREATE TABLE IF NOT EXISTS org
(
   oid            int          auto_increment            NOT NULL PRIMARY KEY
  ,ouid           varchar(36)                            NOT NULL
  ,account_number varchar(20)                            NULL
  ,name           varchar(256)                           NULL
  ,name_short     varchar(50)                            NULL
  ,description    text                                   NULL
  ,attributes     text                                   NULL
  ,is_active      char(1)      DEFAULT (_utf8mb4'Y')     NULL
  ,created        timestamp    DEFAULT CURRENT_TIMESTAMP NULL
  ,modified       timestamp    DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

alter table org
    add constraint oid_UNIQUE
    unique (oid);


alter table org
    modify oid int auto_increment;

alter table org
    auto_increment = 1;

alter table org
    add constraint ouid_UNIQUE
    unique (ouid);


CREATE TABLE IF NOT EXISTS person
(
   person_id                bigint       auto_increment            NOT NULL PRIMARY KEY
  ,person_uid               varchar(36)  DEFAULT (uuid())          NOT NULL
  ,email                    varchar(256)                           NULL
  ,email_normalized         varchar(256)                           NULL
  ,is_email_verified        tinyint(1)   DEFAULT 0                 NULL
  ,is_bad_email             tinyint(1)   DEFAULT 0                 NULL
  ,company_name             varchar(100)                           NULL
  ,title                    varchar(100)                           NULL
  ,first_name               varchar(100)                           NULL
  ,middle_name              varchar(80)                            NULL
  ,last_name                varchar(100)                           NULL
  ,display_name             varchar(300)                           NULL
  ,address1                 varchar(150)                           NULL
  ,address2                 varchar(150)                           NULL
  ,address3                 varchar(150)                           NULL
  ,city                     varchar(100)                           NULL
  ,state_code               varchar(4)                             NULL
  ,country_code             varchar(4)                             NULL
  ,postal_code              varchar(50)                            NULL
  ,phone1                   varchar(20)                            NULL
  ,phone1_ext               varchar(10)                            NULL
  ,phone1_type_code         varchar(20)                            NULL
  ,phone2                   varchar(20)                            NULL
  ,phone2_ext               varchar(10)                            NULL
  ,phone2_type_code         varchar(20)                            NULL
  ,phone3                   varchar(20)                            NULL
  ,phone3_ext               varchar(10)                            NULL
  ,phone3_type_code         varchar(20)                            NULL
  ,is_mobile_phone_verified tinyint(1)   DEFAULT 0                 NULL
  ,message_type_code        varchar(20)                            NULL
  ,is_active                tinyint(1)   DEFAULT 1                 NULL
  ,is_employee              tinyint(1)   DEFAULT 0                 NULL
  ,attributes               json                                   NULL
  ,created                  timestamp    DEFAULT CURRENT_TIMESTAMP NULL
  ,modified                 timestamp    DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
  ,created_on               timestamp    DEFAULT CURRENT_TIMESTAMP NULL
  ,created_by               varchar(50)                            NULL
  ,modified_by              varchar(50)                            NULL
  ,modified_on              timestamp    DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

alter table person
    add constraint person_person_id_uindex
    unique (person_id);


alter table person
    modify person_id bigint auto_increment;

alter table person
    auto_increment = 1;

alter table person
    add constraint person_pk
    unique (person_uid);


CREATE TABLE IF NOT EXISTS person_phone_type
(
   organization_uid varchar(36) DEFAULT ('00000000-0000-0000-0000-000000000000') NOT NULL
  ,phone_type_code  varchar(20)                                                  NOT NULL
  ,description      varchar(50)                                                  NULL
  ,is_active        tinyint(1)  DEFAULT 1                                        NULL
  ,is_mobile        tinyint(1)  DEFAULT 0                                        NULL
  ,has_extension    tinyint(1)  DEFAULT 0                                        NULL
  ,seq              int                                                          NULL
  ,created_on       timestamp   DEFAULT CURRENT_TIMESTAMP                        NULL
  ,created_by       varchar(50)                                                  NULL
  ,modified_by      varchar(50)                                                  NULL
  ,modified_on      timestamp   DEFAULT CURRENT_TIMESTAMP                        NULL on update CURRENT_TIMESTAMP
);

alter table person_phone_type
    add primary key (organization_uid,phone_type_code);


CREATE TABLE IF NOT EXISTS person_photo_type
(
   photo_type_code varchar(20)                           NOT NULL PRIMARY KEY
  ,name            varchar(50)                           NULL
  ,is_active       tinyint(1)  DEFAULT 1                 NULL
  ,created_on      timestamp   DEFAULT CURRENT_TIMESTAMP NULL
  ,created_by      varchar(50)                           NULL
  ,modified_by     varchar(50)                           NULL
  ,modified_on     timestamp   DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS time_zone
(
   uid             varchar(36) DEFAULT (uuid())          NOT NULL PRIMARY KEY
  ,time_zone_name  varchar(50)                           NULL
  ,zone_code       varchar(20)                           NULL
  ,start_time      timestamp                             NULL
  ,end_time        timestamp                             NULL
  ,standard_offset int                                   NULL
  ,wall_offset     int                                   NULL
  ,version         tinytext                              NULL
  ,created         timestamp   DEFAULT CURRENT_TIMESTAMP NULL
  ,modified        timestamp   DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
  ,created_on      timestamp   DEFAULT CURRENT_TIMESTAMP NULL
  ,created_by      varchar(50)                           NULL
  ,modified_by     varchar(50)                           NULL
  ,modified_on     timestamp   DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_password
(
   id                 bigint       auto_increment            NOT NULL PRIMARY KEY
  ,uid                varchar(36)  DEFAULT (uuid())          NOT NULL
  ,user_uid           varchar(36)                            NULL
  ,encryption_version int          DEFAULT 0                 NULL
  ,password_hash      varchar(200)                           NULL
  ,created_on         timestamp    DEFAULT CURRENT_TIMESTAMP NULL
  ,created_by         varchar(50)                            NULL
  ,modified_by        varchar(50)                            NULL
  ,modified_on        timestamp    DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

alter table user_password
    add constraint user_password_pk_2
    unique (user_uid);


CREATE TABLE IF NOT EXISTS user_setting
(
   id           int         auto_increment            NOT NULL PRIMARY KEY
  ,user_uid     varchar(36)                           NULL
  ,app_code     varchar(20)                           NOT NULL
  ,all_settings text                                  NULL
  ,created_on   timestamp   DEFAULT CURRENT_TIMESTAMP NULL
  ,created_by   varchar(50)                           NULL
  ,modified_by  varchar(50)                           NULL
  ,modified_on  timestamp   DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

create index user_uid
	on user_setting (user_uid);

CREATE TABLE IF NOT EXISTS user
(
   user_id               int          auto_increment            NOT NULL PRIMARY KEY
  ,user_uid              varchar(36)  DEFAULT (uuid())          NOT NULL
  ,person_uid            varchar(36)                            NULL
  ,organization_uid      varchar(36)                            NOT NULL
  ,username_normalized   varchar(256)                           NULL
  ,username              varchar(256)                           NULL
  ,display_name          varchar(300)                           NULL
  ,login_attempts        int          DEFAULT 0                 NULL
  ,last_login_attempt    datetime                               NULL
  ,last_login_date       timestamp                              NULL
  ,date_of_activation    datetime                               NULL
  ,date_of_expiration    datetime                               NULL
  ,date_password_expires int                                    NULL
  ,password_seed         varchar(10)                            NULL
  ,user_external_type    varchar(50)                            NULL
  ,user_external_uid     varchar(36)                            NULL
  ,archived_username     varchar(150)                           NULL
  ,is_archived           tinyint(1)   DEFAULT 0                 NOT NULL
  ,is_mfa_enabled        tinyint(1)   DEFAULT 0                 NOT NULL
  ,is_active             tinyint(1)   DEFAULT 1                 NULL
  ,lockout_end_on        datetime(6)                            NULL
  ,is_locked_out         tinyint(1)   DEFAULT 0                 NOT NULL
  ,reset_code            varchar(20)                            NULL
  ,reset_date            datetime                               NULL
  ,locale_code           varchar(20)  DEFAULT (_utf8mb4'en-us') NULL
  ,login_date            timestamp    DEFAULT CURRENT_TIMESTAMP NULL
  ,security_stamp        text                                   NULL
  ,concurrency_stamp     text                                   NULL
  ,created_on            timestamp    DEFAULT CURRENT_TIMESTAMP NULL
  ,created_by            varchar(50)                            NULL
  ,modified_by           varchar(50)                            NULL
  ,modified_on           timestamp    DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

alter table user
	add constraint organization_uid_FK
	foreign key (organization_uid) references org (ouid);


alter table user
    add constraint user_pk3
    unique (user_uid);


CREATE TABLE IF NOT EXISTS person_photo
(
   id              bigint      auto_increment            NOT NULL PRIMARY KEY
  ,uid             varchar(36) DEFAULT (uuid())          NOT NULL
  ,person_id       bigint                                NULL
  ,picture         longblob                              NULL
  ,photo_type_code varchar(20)                           NOT NULL
  ,created_on      timestamp   DEFAULT CURRENT_TIMESTAMP NULL
  ,created_by      varchar(50)                           NULL
  ,modified_by     varchar(50)                           NULL
  ,modified_on     timestamp   DEFAULT CURRENT_TIMESTAMP NULL on update CURRENT_TIMESTAMP
);

alter table person_photo
	add constraint person_photo_person_person_id_fk
	foreign key (person_id) references person (person_id);


alter table person_photo
	add constraint person_photo_person_photo_type_photo_type_code_fk
	foreign key (photo_type_code) references person_photo_type (photo_type_code);


alter table person_photo
    add constraint person_photo_pk
    unique (uid);
