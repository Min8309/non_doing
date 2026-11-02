begin;
-- Run in the Supabase SQL editor. Browser roles receive RPC access only.
create table public.letter_users (
 id uuid primary key references auth.users(id) on delete cascade,
 nickname_index int not null default floor(random()*3) check (nickname_index between 0 and 2),
 trust_score int not null default 100 check (trust_score between 0 and 100),
 pen_points int not null default 3 check (pen_points between 0 and 3),
 ticket_day date not null default (now() at time zone 'Asia/Seoul')::date,
 is_shadow_banned boolean not null default false,
 created_at timestamptz not null default now(), last_sent_at timestamptz
);
create table public.letter_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.letter_users(id) on delete cascade,
 category text not null check (category in ('BURNOUT','FAILURE','ANXIETY','DAILY')),
 content text not null check (char_length(regexp_replace(content,'[[:space:]]','','g')) between 50 and 300),
 status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','COMPLETED','BLOCKED','QUARANTINED')),
 reply_limit int not null default 3 check (reply_limit=3), received_replies int not null default 0 check (received_replies between 0 and 3),
 client_nonce uuid not null, created_at timestamptz not null default now(), unique(user_id,client_nonce)
);
create table public.reply_letters (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.letter_requests(id) on delete cascade,
 sender_id uuid not null references public.letter_users(id) on delete cascade,
 receiver_id uuid not null references public.letter_users(id) on delete cascade,
 content text not null check (char_length(regexp_replace(content,'[[:space:]]','','g')) between 50 and 400),
 attached_sticker_id text check (attached_sticker_id in ('WARM_TEA','HUG','STARRY_SKY')),
 moderation_status text not null default 'PENDING' check (moderation_status in ('PENDING','APPROVED','QUARANTINED','SHADOW_REJECTED','DELIVERED')),
 toxicity_score numeric(4,3) check (toxicity_score between 0 and 1), flagged_reasons text[] not null default '{}',
 is_opened boolean not null default false, deliver_after timestamptz, delivered_at timestamptz, hidden_at timestamptz,
 client_nonce uuid not null, created_at timestamptz not null default now(),
 unique(request_id,sender_id), unique(sender_id,client_nonce), check(sender_id<>receiver_id)
);
create table public.reply_reactions (
 id uuid primary key default gen_random_uuid(), reply_id uuid not null references public.reply_letters(id) on delete cascade,
 receiver_id uuid not null references public.letter_users(id) on delete cascade,
 reaction_sticker_id text not null check(reaction_sticker_id in ('WARM_TEA','HUG','STARRY_SKY')),
 created_at timestamptz not null default now(), unique(reply_id,receiver_id)
);
create table public.user_blocks (
 blocker_id uuid not null references public.letter_users(id) on delete cascade,
 blocked_user_id uuid not null references public.letter_users(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(blocker_id,blocked_user_id), check(blocker_id<>blocked_user_id)
);
create table public.letter_reports (
 id uuid primary key default gen_random_uuid(), reply_id uuid not null references public.reply_letters(id) on delete cascade,
 reporter_id uuid not null references public.letter_users(id) on delete cascade,
 created_at timestamptz not null default now(), unique(reply_id,reporter_id)
);
create table public.letter_moderation_jobs (
 id uuid primary key default gen_random_uuid(), request_id uuid references public.letter_requests(id) on delete cascade,
 reply_id uuid references public.reply_letters(id) on delete cascade,
 state text not null default 'PENDING' check(state in ('PENDING','PROCESSING','COMPLETE')),
 attempts int not null default 0, leased_until timestamptz, lease_token uuid,
 created_at timestamptz not null default now(), check(num_nonnulls(request_id,reply_id)=1), unique(request_id), unique(reply_id)
);
create index letter_requests_active on public.letter_requests(created_at) where status='ACTIVE';
create index reply_letters_delivery on public.reply_letters(deliver_after) where moderation_status='APPROVED';
create index reply_letters_inbox on public.reply_letters(receiver_id,delivered_at desc) where moderation_status='DELIVERED';
create index letter_jobs_pending on public.letter_moderation_jobs(state,leased_until,created_at);
-- No client may read raw users, pending content, risk metadata or jobs.
alter table public.letter_users enable row level security;
alter table public.letter_requests enable row level security;
alter table public.reply_letters enable row level security;
alter table public.reply_reactions enable row level security;
alter table public.user_blocks enable row level security;
alter table public.letter_reports enable row level security;
alter table public.letter_moderation_jobs enable row level security;
revoke all on public.letter_users,public.letter_requests,public.reply_letters,public.reply_reactions,public.user_blocks,public.letter_reports,public.letter_moderation_jobs from anon,authenticated;
grant all on public.letter_users,public.letter_requests,public.reply_letters,public.reply_reactions,public.user_blocks,public.letter_reports,public.letter_moderation_jobs to service_role;

create function public.letter_identity() returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); today date:=(now() at time zone 'Asia/Seoul')::date; old_day date;
begin
 if u is null then raise exception 'AUTH_REQUIRED'; end if;
 insert into public.letter_users(id) values(u) on conflict do nothing;
 select ticket_day into old_day from public.letter_users where id=u for update;
 if old_day<today then
  update public.letter_users set pen_points=case when exists(
   select 1 from public.reply_reactions g join public.reply_letters r on r.id=g.reply_id
   where r.sender_id=u and (g.created_at at time zone 'Asia/Seoul')::date>=old_day
  ) then 3 else pen_points end,ticket_day=today where id=u;
 end if;
 return u;
end $$;
create function public.letter_state() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.letter_identity(); result jsonb;
begin
 select jsonb_build_object('nicknameIndex',nickname_index,'tickets',pen_points,'canSend',trust_score>=60) into result from public.letter_users where id=u;
 return result;
end $$;
create function public.letter_create_request(p_category text,p_content text,p_nonce uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=public.letter_identity(); existing public.letter_requests; result uuid;
begin
 p_content:=normalize(p_content,NFKC);
 select * into existing from public.letter_requests where user_id=u and client_nonce=p_nonce;
 if found then if existing.content<>p_content or existing.category<>p_category then raise exception 'NONCE_CONFLICT';end if;return existing.id;end if;
 if (select trust_score<60 from public.letter_users where id=u) then raise exception 'SEND_UNAVAILABLE';end if;
 if exists(select 1 from public.letter_requests where user_id=u and created_at>now()-interval '24 hours') then raise exception 'DAILY_REQUEST_LIMIT';end if;
 insert into public.letter_requests(user_id,category,content,client_nonce) values(u,p_category,p_content,p_nonce) returning id into result;
 insert into public.letter_moderation_jobs(request_id) values(result);
 return result;
end $$;
create function public.letter_available_requests() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.letter_identity();result jsonb;
begin
 select coalesce(jsonb_agg(row_to_json(q)),'[]'::jsonb) into result from (
  select r.id,r.category,r.content from public.letter_requests r
  where r.status='ACTIVE' and r.user_id<>u
  and exists(select 1 from public.letter_users author where author.id=r.user_id and not author.is_shadow_banned and author.trust_score>=60)
  and not exists(select 1 from public.user_blocks b where (b.blocker_id=u and b.blocked_user_id=r.user_id) or (b.blocker_id=r.user_id and b.blocked_user_id=u))
  and not exists(select 1 from public.reply_letters t where t.request_id=r.id and t.sender_id=u)
  and (select count(*) from public.reply_letters t where t.request_id=r.id and t.moderation_status<>'SHADOW_REJECTED')<r.reply_limit
  order by r.created_at limit 5
 ) q;
 return result;
end $$;
create function public.letter_submit_reply(p_request uuid,p_content text,p_nonce uuid,p_sticker text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=public.letter_identity();r public.letter_requests;s public.letter_users;existing public.reply_letters;result uuid;
begin
 p_content:=normalize(p_content,NFKC);
 select * into s from public.letter_users where id=u for update;
 select * into existing from public.reply_letters where sender_id=u and client_nonce=p_nonce;
 if found then if existing.content<>p_content or existing.request_id<>p_request or existing.attached_sticker_id is distinct from p_sticker then raise exception 'NONCE_CONFLICT';end if;return existing.id;end if;
 if s.trust_score<60 or s.pen_points<1 then raise exception 'SEND_UNAVAILABLE';end if;
 if s.last_sent_at>now()-interval '60 seconds' then raise exception 'COOLDOWN';end if;
 select * into r from public.letter_requests where id=p_request for update;
 if not found or r.status<>'ACTIVE' or r.user_id=u then raise exception 'REQUEST_UNAVAILABLE';end if;
 if exists(select 1 from public.user_blocks b where (b.blocker_id=u and b.blocked_user_id=r.user_id) or (b.blocker_id=r.user_id and b.blocked_user_id=u)) then raise exception 'REQUEST_UNAVAILABLE';end if;
 if (select count(*) from public.reply_letters where request_id=r.id and moderation_status<>'SHADOW_REJECTED')>=r.reply_limit then raise exception 'REQUEST_FULL';end if;
 insert into public.reply_letters(request_id,sender_id,receiver_id,content,client_nonce,attached_sticker_id) values(r.id,u,r.user_id,p_content,p_nonce,p_sticker) returning id into result;
 update public.letter_users set pen_points=pen_points-1,last_sent_at=now() where id=u;
 insert into public.letter_moderation_jobs(reply_id) values(result);
 return result;
end $$;
create function public.letter_inbox() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.letter_identity();result jsonb;
begin
 select coalesce(jsonb_agg(row_to_json(q)),'[]'::jsonb) into result from (
  select r.id,r.content,r.attached_sticker_id,r.delivered_at,
   (select g.reaction_sticker_id from public.reply_reactions g where g.reply_id=r.id and g.receiver_id=u) as reaction
  from public.reply_letters r where r.receiver_id=u and r.moderation_status='DELIVERED' and r.hidden_at is null
  and not exists(select 1 from public.user_blocks b where (b.blocker_id=u and b.blocked_user_id=r.sender_id) or (b.blocker_id=r.sender_id and b.blocked_user_id=u))
  order by r.delivered_at desc limit 50
 ) q;return result;
end $$;
create function public.letter_react(p_reply uuid,p_sticker text) returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=public.letter_identity();r public.reply_letters;
begin
 select * into r from public.reply_letters where id=p_reply for update;
 if not found or r.receiver_id<>u or r.moderation_status<>'DELIVERED' or r.hidden_at is not null then raise exception 'LETTER_UNAVAILABLE';end if;
 if exists(select 1 from public.user_blocks where (blocker_id=u and blocked_user_id=r.sender_id) or (blocker_id=r.sender_id and blocked_user_id=u)) then raise exception 'LETTER_UNAVAILABLE';end if;
 insert into public.reply_reactions(reply_id,receiver_id,reaction_sticker_id) values(r.id,u,p_sticker) on conflict(reply_id,receiver_id) do nothing;
 return true;
end $$;
create function public.letter_hide_and_block(p_reply uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=public.letter_identity();r public.reply_letters;
begin
 select * into r from public.reply_letters where id=p_reply for update;
 if not found or r.receiver_id<>u or r.moderation_status<>'DELIVERED' then raise exception 'LETTER_UNAVAILABLE';end if;
 update public.reply_letters set hidden_at=now() where receiver_id=u and sender_id=r.sender_id and hidden_at is null;
 insert into public.user_blocks(blocker_id,blocked_user_id) values(u,r.sender_id) on conflict do nothing;
 insert into public.letter_reports(reply_id,reporter_id) values(r.id,u) on conflict do nothing;
 return true;
end $$;
-- Authenticated worker functions. Only service_role can claim, classify or deliver.
create function public.letter_claim_jobs(p_limit int default 5) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 with picked as (
  select id from public.letter_moderation_jobs where state='PENDING' or (state='PROCESSING' and leased_until<now()) order by created_at for update skip locked limit least(greatest(p_limit,1),10)
 ), claimed as (
  update public.letter_moderation_jobs j set state='PROCESSING',attempts=attempts+1,leased_until=now()+interval '2 minutes',lease_token=gen_random_uuid()
  from picked where j.id=picked.id returning j.*
 ) select coalesce(jsonb_agg(jsonb_build_object('id',j.id,'lease',j.lease_token,'attempts',j.attempts,'kind',case when j.request_id is not null then 'request' else 'reply' end,'content',coalesce(r.content,t.content),'context',(select content from public.letter_requests where id=t.request_id))),'[]'::jsonb)
 into result from claimed j left join public.letter_requests r on r.id=j.request_id left join public.reply_letters t on t.id=j.reply_id;
 return result;
end $$;
create function public.letter_complete_job(p_job uuid,p_lease uuid,p_score numeric,p_flags text[],p_crisis boolean default false,p_human boolean default false) returns boolean language plpgsql security definer set search_path='' as $$
declare j public.letter_moderation_jobs;bad boolean;status_value text;
begin
 if p_score is null or p_score<0 or p_score>1 then raise exception 'INVALID_SCORE';end if;
 select * into j from public.letter_moderation_jobs where id=p_job for update;
 if not found or j.state<>'PROCESSING' or j.lease_token<>p_lease then return false;end if;
 if j.request_id is not null then
  select is_shadow_banned into bad from public.letter_users where id=(select user_id from public.letter_requests where id=j.request_id);
  update public.letter_requests set status=case when bad or p_score>.60 then 'BLOCKED' when p_crisis or p_human or p_score>.20 then 'QUARANTINED' else 'ACTIVE' end where id=j.request_id;
 else
  select is_shadow_banned into bad from public.letter_users where id=(select sender_id from public.reply_letters where id=j.reply_id);
  status_value:=case when bad or p_score>.60 then 'SHADOW_REJECTED' when p_crisis or p_human or p_score>.20 then 'QUARANTINED' else 'APPROVED' end;
  update public.reply_letters set moderation_status=status_value,toxicity_score=p_score,flagged_reasons=p_flags,
   deliver_after=case when status_value='APPROVED' then now()+make_interval(secs=>300+floor(random()*901)::int) end where id=j.reply_id;
 end if;
 update public.letter_moderation_jobs set state='COMPLETE',leased_until=null where id=j.id;
 return true;
end $$;
create function public.letter_retry_job(p_job uuid,p_lease uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare j public.letter_moderation_jobs;
begin
 select * into j from public.letter_moderation_jobs where id=p_job for update;
 if not found or j.lease_token<>p_lease or j.state<>'PROCESSING' then return false;end if;
 if j.attempts>=5 then
  update public.letter_requests set status='QUARANTINED' where id=j.request_id;
  update public.reply_letters set moderation_status='QUARANTINED',flagged_reasons=array['REVIEW_UNAVAILABLE'] where id=j.reply_id;
  update public.letter_moderation_jobs set state='COMPLETE',leased_until=null where id=j.id;
 else update public.letter_moderation_jobs set state='PENDING',leased_until=null where id=j.id;end if;
 return true;
end $$;
create function public.letter_deliver_batch(p_limit int default 50) returns int language plpgsql security definer set search_path='' as $$
declare r public.reply_letters;target public.letter_requests;delivered int:=0;
begin
 for r in select * from public.reply_letters where moderation_status='APPROVED' and deliver_after<=now() order by deliver_after for update skip locked limit least(greatest(p_limit,1),100) loop
  select * into target from public.letter_requests where id=r.request_id for update;
  if target.status not in ('ACTIVE','COMPLETED') or target.received_replies>=target.reply_limit
   or (select is_shadow_banned or trust_score<60 from public.letter_users where id=r.sender_id)
   or exists(select 1 from public.user_blocks where (blocker_id=r.sender_id and blocked_user_id=r.receiver_id) or (blocker_id=r.receiver_id and blocked_user_id=r.sender_id)) then
   update public.reply_letters set moderation_status='SHADOW_REJECTED' where id=r.id;
  else
   update public.reply_letters set moderation_status='DELIVERED',delivered_at=now() where id=r.id;
   update public.letter_requests set received_replies=received_replies+1,status=case when received_replies+1>=reply_limit then 'COMPLETED' else status end where id=target.id;
   delivered:=delivered+1;
  end if;
 end loop;return delivered;
end $$;
-- Manual review is performed by a trusted operator, never by a browser client.
create function public.letter_human_review(p_request uuid default null,p_reply uuid default null,p_approve boolean default false) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if num_nonnulls(p_request,p_reply)<>1 then raise exception 'INVALID_TARGET';end if;
 if p_request is not null then
  update public.letter_requests set status=case when p_approve then 'ACTIVE' else 'BLOCKED' end where id=p_request and status='QUARANTINED';
 else
  update public.reply_letters set moderation_status=case when p_approve then 'APPROVED' else 'SHADOW_REJECTED' end,deliver_after=case when p_approve then now()+make_interval(secs=>300+floor(random()*901)::int) end where id=p_reply and moderation_status='QUARANTINED';
 end if;return found;
end $$;
revoke all on function public.letter_identity(),public.letter_state(),public.letter_create_request(text,text,uuid),public.letter_available_requests(),public.letter_submit_reply(uuid,text,uuid,text),public.letter_inbox(),public.letter_react(uuid,text),public.letter_hide_and_block(uuid) from public,anon;
grant execute on function public.letter_state(),public.letter_create_request(text,text,uuid),public.letter_available_requests(),public.letter_submit_reply(uuid,text,uuid,text),public.letter_inbox(),public.letter_react(uuid,text),public.letter_hide_and_block(uuid) to authenticated;
revoke all on function public.letter_claim_jobs(int),public.letter_complete_job(uuid,uuid,numeric,text[],boolean,boolean),public.letter_retry_job(uuid,uuid),public.letter_deliver_batch(int),public.letter_human_review(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.letter_claim_jobs(int),public.letter_complete_job(uuid,uuid,numeric,text[],boolean,boolean),public.letter_retry_job(uuid,uuid),public.letter_deliver_batch(int),public.letter_human_review(uuid,uuid,boolean) to service_role;

commit;
