// Supabase Edge Function: smart-service
// 역할: 앱에서 분석 결과가 없을 때 수동으로 호출하는 fallback 감정 분석 함수.
//       DB Webhook 실패 또는 지연 시 클라이언트가 직접 트리거.
//
// 로컬 개발:  supabase functions serve smart-service
// 배포:       supabase functions deploy smart-service
// 호출 방식:  supabase.functions.invoke('smart-service', { body: { postId, content, title? } })
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { analyzeAndSave } from '../_shared/analyze.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body = (await req.json()) as {
      postId?: number;
      content?: string;
      title?: string;
    };

    const postId = body.postId;
    const content = body.content ?? '';
    const title = body.title;

    if (!postId || typeof postId !== 'number') {
      return new Response(JSON.stringify({ ok: false, reason: 'postId_required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      console.error('[smart-service] ANTHROPIC_API_KEY 미설정');
      return new Response(JSON.stringify({ ok: false, reason: 'missing_api_key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await analyzeAndSave({
      supabaseUrl: Deno.env.get('SUPABASE_URL')!,
      supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      anthropicApiKey,
      postId,
      content,
      title,
    });

    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[smart-service] 오류:', err);
    return new Response(
      JSON.stringify({ ok: false, reason: err instanceof Error ? err.message : 'unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
