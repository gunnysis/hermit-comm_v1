// Supabase Edge Function: analyze-post
// 역할: Supabase DB Webhook이 posts INSERT 이벤트 발생 시 자동 호출.
//       게시글 감정을 분석하여 post_analysis 테이블에 저장.
//
// 로컬 개발:  supabase functions serve analyze-post
// 배포:       supabase functions deploy analyze-post
// Webhook 설정: Supabase Dashboard → Database → Webhooks
//   - Table: posts, Events: INSERT
//   - URL: https://<project>.supabase.co/functions/v1/analyze-post
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { analyzeAndSave } from '../_shared/analyze.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const payload = (await req.json()) as {
      type: string;
      table: string;
      schema: string;
      record: { id: number; title?: string; content?: string };
      old_record: unknown;
    };

    if (payload.type !== 'INSERT' || payload.table !== 'posts' || payload.schema !== 'public') {
      return new Response(JSON.stringify({ ok: false, reason: 'invalid_event' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const postId = payload.record?.id;
    const content = payload.record?.content ?? '';
    const title = payload.record?.title;

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      console.error('[analyze-post] ANTHROPIC_API_KEY 미설정');
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
    console.error('[analyze-post] 오류:', err);
    return new Response(
      JSON.stringify({ ok: false, reason: err instanceof Error ? err.message : 'unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
