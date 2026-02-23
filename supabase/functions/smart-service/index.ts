// Supabase Edge Function: smart-service
// 배포 URL: https://qwrjebpsjjdxhhhllqcw.supabase.co/functions/v1/smart-service
//
// 로컬 개발:  supabase functions serve smart-service
// 배포:       supabase functions deploy smart-service
//
// 이 파일은 프로덕션에 배포된 smart-service 함수의 로컬 사본입니다.
// 실제 로직은 기능(features) 프로젝트의 functions/index.ts 에서 유지됩니다.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1';

const EMOTIONS_LIST =
  '고립감, 무기력, 불안, 외로움, 슬픔, 그리움, 두려움, 답답함, 설렘, 기대감, 안도감, 평온함, 즐거움';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
      return new Response(JSON.stringify({ ok: false, reason: 'invalid event' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const postId = payload.record?.id;
    const rawContent = payload.record?.content ?? '';
    const text = stripHtml(rawContent);
    if (text.length < 10) {
      return new Response(JSON.stringify({ ok: true, skipped: 'content_too_short' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not set');
      return new Response(JSON.stringify({ ok: false, reason: 'missing_api_key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `다음 게시글 내용에서 느껴지는 감정을 아래 목록에서만 골라 JSON 배열로만 답해줘. 다른 말 없이 ["감정1", "감정2"] 형태로만. 최대 3개.
감정 목록: ${EMOTIONS_LIST}

게시글 내용:
${text.slice(0, 2000)}`,
        },
      ],
    });

    const textBlock = message.content.find((c) => c.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '';
    let emotions: string[] = [];
    try {
      const parsed = JSON.parse(raw.trim()) as unknown;
      emotions = Array.isArray(parsed)
        ? parsed.filter((e): e is string => typeof e === 'string').slice(0, 3)
        : [];
    } catch {
      // 파싱 실패 시 빈 배열
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.from('post_analysis').insert({
      post_id: postId,
      emotions,
    });

    if (error) {
      console.error('post_analysis insert error:', error);
      return new Response(JSON.stringify({ ok: false, reason: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, emotions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('smart-service error:', err);
    return new Response(
      JSON.stringify({ ok: false, reason: err instanceof Error ? err.message : 'unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
