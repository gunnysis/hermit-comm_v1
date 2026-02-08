-- 은둔마을 커뮤니티 초기 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. posts 테이블 생성
create table if not exists posts (
  id bigserial primary key,
  title text not null,
  content text not null,
  author text not null,
  created_at timestamptz default now()
);

-- 2. comments 테이블 생성
create table if not exists comments (
  id bigserial primary key,
  post_id bigint not null references posts(id) on delete cascade,
  content text not null,
  author text not null,
  created_at timestamptz default now()
);

-- 3. reactions 테이블 생성 (집계 저장 방식)
create table if not exists reactions (
  id bigserial primary key,
  post_id bigint not null references posts(id) on delete cascade,
  reaction_type text not null,
  count int default 0,
  unique(post_id, reaction_type)
);

-- 4. 인덱스 생성 (성능 최적화)
create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_reactions_post_id on reactions(post_id);
create index if not exists idx_posts_created_at on posts(created_at desc);

-- 5. RLS (Row Level Security) 활성화
alter table posts enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;

-- 6. RLS 정책 생성 (익명 사용자 전체 권한)
-- posts 테이블 정책
create policy "Anyone can read posts" 
  on posts for select 
  using (true);

create policy "Anyone can create posts" 
  on posts for insert 
  with check (true);

create policy "Anyone can delete posts" 
  on posts for delete 
  using (true);

-- comments 테이블 정책
create policy "Anyone can read comments" 
  on comments for select 
  using (true);

create policy "Anyone can create comments" 
  on comments for insert 
  with check (true);

create policy "Anyone can delete comments" 
  on comments for delete 
  using (true);

-- reactions 테이블 정책
create policy "Anyone can read reactions" 
  on reactions for select 
  using (true);

create policy "Anyone can insert reactions" 
  on reactions for insert 
  with check (true);

create policy "Anyone can update reactions" 
  on reactions for update 
  using (true);

-- 7. Realtime 활성화 (발행)
-- Supabase 대시보드에서 Database → Replication으로 가서
-- 다음 테이블들의 Realtime을 활성화하세요:
-- - posts
-- - comments  
-- - reactions

-- 8. 샘플 데이터 (선택사항)
-- insert into posts (title, content, author) values
--   ('첫 번째 게시글', '은둔마을에 오신 것을 환영합니다!', '관리자'),
--   ('Supabase 전환 완료', '이제 실시간 업데이트가 가능합니다.', '개발자');
