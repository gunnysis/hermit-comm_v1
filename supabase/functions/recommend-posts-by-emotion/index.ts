// Supabase Edge Function: recommend-posts-by-emotion
// 역할: 감정 기반 비슷한 글 추천. RPC get_recommended_posts_by_emotion 호출 결과를 JSON으로 반환.
//       클라이언트에서 RPC를 직접 호출해도 되고, 캐시/제한이 필요하면 이 함수를 사용.
//
// 로컬: supabase functions serve recommend-posts-by-emotion
// 배포: supabase functions deploy recommend-posts-by-emotion
// 호출: POST { body: { postId: number, limit?: number } }
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body = (await req.json()) as { postId?: number; limit?: number };
    const postId = body.postId;
    const limit = Math.min(Math.max(body.limit ?? 10, 1), 30);

    if (!postId || typeof postId !== 'number') {
      return new Response(JSON.stringify({ ok: false, reason: 'postId_required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc('get_recommended_posts_by_emotion', {
      p_post_id: postId,
      p_limit: limit,
    });

    if (error) {
      console.error('[recommend-posts-by-emotion] RPC 에러:', error.message);
      return new Response(JSON.stringify({ ok: false, reason: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, posts: data ?? [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[recommend-posts-by-emotion] 오류:', err);
    return new Response(
      JSON.stringify({ ok: false, reason: err instanceof Error ? err.message : 'unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
