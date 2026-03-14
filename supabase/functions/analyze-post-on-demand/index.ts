// Supabase Edge Function: analyze-post-on-demand
// 역할: 앱에서 분석 결과가 없거나 재분석이 필요할 때 수동으로 호출하는 감정 분석 함수.
//       DB Webhook 실패/지연 시 fallback + 수동 재시도 버튼에서 사용.
//       force=true로 호출하여 쿨다운을 우회한다.
//
// 로컬: supabase functions serve analyze-post-on-demand
// 배포: supabase functions deploy analyze-post-on-demand
// 호출: supabase.functions.invoke('analyze-post-on-demand', { body: { postId, content, title? } })
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { analyzeAndSave } from '../_shared/analyze.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as {
      postId?: number;
      content?: string;
      title?: string;
    };

    const postId = body.postId;
    let content = body.content ?? '';
    let title = body.title;

    if (!postId || typeof postId !== 'number') {
      return new Response(JSON.stringify({ ok: false, reason: 'postId_required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // content가 없으면 DB에서 조회 (클라이언트 캐시 미스 대비)
    if (!content) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { data: post } = await supabase
        .from('posts')
        .select('content, title')
        .eq('id', postId)
        .single();
      if (post) {
        content = post.content ?? '';
        title = title ?? post.title;
      }
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[analyze-post-on-demand] GEMINI_API_KEY 미설정');
      return new Response(JSON.stringify({ ok: false, reason: 'missing_api_key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await analyzeAndSave({
      supabaseUrl: Deno.env.get('SUPABASE_URL')!,
      supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      geminiApiKey,
      postId,
      content,
      title,
      force: true,
    });

    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[analyze-post-on-demand] 오류:', err);
    return new Response(
      JSON.stringify({ ok: false, reason: err instanceof Error ? err.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
