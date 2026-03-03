// Supabase Edge Function: analyze-post
// 역할: Supabase DB Webhook이 posts INSERT/UPDATE 이벤트 발생 시 자동 호출.
//       게시글 감정을 분석하여 post_analysis 테이블에 저장.
//       UPDATE 시 content/title 변경분만 트리거됨 (DB WHEN 절).
//       60초 쿨다운으로 연속 수정 시 비용 방지.
//
// 로컬 개발:  supabase functions serve analyze-post
// 배포:       supabase functions deploy analyze-post
// 트리거: DB trigger (analyze_post_on_insert, analyze_post_on_update)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { analyzeAndSave } from '../_shared/analyze.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as {
      type: string;
      table: string;
      schema: string;
      record: { id: number; title?: string; content?: string };
      old_record: { title?: string; content?: string } | null;
    };

    const isInsert = payload.type === 'INSERT';
    const isUpdate = payload.type === 'UPDATE';

    if ((!isInsert && !isUpdate) || payload.table !== 'posts' || payload.schema !== 'public') {
      return new Response(JSON.stringify({ ok: false, reason: 'invalid_event' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UPDATE: content/title 미변경이면 스킵 (DB WHEN 절의 이중 안전장치)
    if (isUpdate && payload.old_record) {
      const oldContent = payload.old_record.content ?? '';
      const oldTitle = payload.old_record.title ?? '';
      const newContent = payload.record?.content ?? '';
      const newTitle = payload.record?.title ?? '';
      if (oldContent === newContent && oldTitle === newTitle) {
        return new Response(JSON.stringify({ ok: true, skipped: 'no_content_change' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const postId = payload.record?.id;
    const content = payload.record?.content ?? '';
    const title = payload.record?.title;

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      console.error('[analyze-post] ANTHROPIC_API_KEY 미설정');
      return new Response(JSON.stringify({ ok: false, reason: 'missing_api_key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[analyze-post] 오류:', err);
    return new Response(
      JSON.stringify({ ok: false, reason: err instanceof Error ? err.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
