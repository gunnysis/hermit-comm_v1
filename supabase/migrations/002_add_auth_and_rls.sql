-- 은둔마을 커뮤니티: 익명 인증 및 RLS 정책 강화
-- Supabase SQL Editor에서 실행하세요

-- ===== 1. 스키마 변경: author_id 컬럼 추가 =====

-- posts 테이블에 author_id 추가
alter table posts add column if not exists author_id uuid references auth.users(id);

-- comments 테이블에 author_id 추가
alter table comments add column if not exists author_id uuid references auth.users(id);

-- 기존 데이터가 있다면 더미 UUID로 설정 (선택사항)
-- 주의: 실제 사용 시 적절한 UUID로 교체하거나 데이터를 삭제하세요
-- update posts set author_id = '00000000-0000-0000-0000-000000000000'::uuid where author_id is null;
-- update comments set author_id = '00000000-0000-0000-0000-000000000000'::uuid where author_id is null;

-- author_id를 필수 컬럼으로 설정
-- 주의: 기존 데이터가 있다면 위의 update 문을 먼저 실행하세요
alter table posts alter column author_id set not null;
alter table comments alter column author_id set not null;

-- 성능 최적화를 위한 인덱스 추가
create index if not exists idx_posts_author_id on posts(author_id);
create index if not exists idx_comments_author_id on comments(author_id);

-- ===== 2. 기존 RLS 정책 삭제 =====

-- posts 테이블 기존 정책 삭제
drop policy if exists "Anyone can read posts" on posts;
drop policy if exists "Anyone can create posts" on posts;
drop policy if exists "Anyone can delete posts" on posts;
drop policy if exists "Everyone can read posts" on posts;
drop policy if exists "Authenticated users can create posts" on posts;
drop policy if exists "Users can delete own posts" on posts;

-- comments 테이블 기존 정책 삭제
drop policy if exists "Anyone can read comments" on comments;
drop policy if exists "Anyone can create comments" on comments;
drop policy if exists "Anyone can delete comments" on comments;
drop policy if exists "Everyone can read comments" on comments;
drop policy if exists "Authenticated users can create comments" on comments;
drop policy if exists "Users can delete own comments" on comments;

-- reactions 테이블 기존 정책 삭제
drop policy if exists "Anyone can read reactions" on reactions;
drop policy if exists "Anyone can insert reactions" on reactions;
drop policy if exists "Anyone can update reactions" on reactions;
drop policy if exists "Everyone can read reactions" on reactions;
drop policy if exists "Authenticated users can create reactions" on reactions;
drop policy if exists "Authenticated users can update reactions" on reactions;

-- ===== 3. 새로운 RLS 정책 생성 =====

-- ----- POSTS 테이블 정책 -----

-- 읽기: 누구나 가능 (공개 커뮤니티)
create policy "Everyone can read posts"
  on posts for select
  using (true);

-- 생성: 인증된 사용자만 가능 (익명 사용자 포함)
-- author_id는 자동으로 현재 사용자의 UUID로 설정됨
create policy "Authenticated users can create posts"
  on posts for insert
  with check (auth.uid() = author_id);

-- 삭제: 작성자 본인만 가능
create policy "Users can delete own posts"
  on posts for delete
  using (auth.uid() = author_id);

-- ----- COMMENTS 테이블 정책 -----

-- 읽기: 누구나 가능
create policy "Everyone can read comments"
  on comments for select
  using (true);

-- 생성: 인증된 사용자만 가능
create policy "Authenticated users can create comments"
  on comments for insert
  with check (auth.uid() = author_id);

-- 삭제: 작성자 본인만 가능
create policy "Users can delete own comments"
  on comments for delete
  using (auth.uid() = author_id);

-- ----- REACTIONS 테이블 정책 -----

-- 반응은 익명으로 유지 (삭제 불가)
create policy "Everyone can read reactions"
  on reactions for select
  using (true);

-- 인증된 사용자는 반응 추가 가능
create policy "Authenticated users can create reactions"
  on reactions for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'anon');

-- 인증된 사용자는 반응 수정 가능 (count 증가)
create policy "Authenticated users can update reactions"
  on reactions for update
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

-- ===== 4. 완료 메시지 =====

-- 마이그레이션이 성공적으로 완료되었습니다!
-- 
-- 다음 단계:
-- 1. Database → Replication에서 Realtime이 여전히 활성화되어 있는지 확인
-- 2. 앱 코드를 업데이트하여 익명 인증을 사용하도록 설정
-- 3. 앱을 재시작하고 테스트
--
-- 테스트 방법:
-- - 새 게시글 작성 시 author_id가 자동으로 설정되는지 확인
-- - 자신의 게시글은 삭제 가능하지만 다른 사람의 게시글은 삭제 불가능한지 확인
