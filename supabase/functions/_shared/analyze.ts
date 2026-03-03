// 감정 분석 공통 모듈
// analyze-post (Webhook 자동 호출: INSERT/UPDATE)와
// analyze-post-on-demand (수동 fallback/재시도) 양쪽에서 사용.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1';

export const EMOTIONS_LIST =
  '고립감, 무기력, 불안, 외로움, 슬픔, 그리움, 두려움, 답답함, 설렘, 기대감, 안도감, 평온함, 즐거움';

// Claude 응답 검증용 허용 감정 집합
// ⚠️ 중앙 정본: supabase-hermit/shared/constants.ts의 ALLOWED_EMOTIONS와 반드시 일치시킬 것
const VALID_EMOTIONS = new Set([
  '고립감',
  '무기력',
  '불안',
  '외로움',
  '슬픔',
  '그리움',
  '두려움',
  '답답함',
  '설렘',
  '기대감',
  '안도감',
  '평온함',
  '즐거움',
]);

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type AnalyzeResult =
  | { ok: true; emotions: string[] }
  | { ok: true; skipped: string }
  | { ok: false; reason: string };

/** 쿨다운 시간 (밀리초). 연속 수정 시 Claude API 비용 방지. */
const COOLDOWN_MS = 60_000;

/**
 * 게시글 감정 분석 후 post_analysis 테이블에 upsert.
 * 제목과 내용을 모두 Claude에 전달해 분석 정확도를 높인다.
 * 허용 감정 목록 외 응답은 필터링하여 hallucination을 방지한다.
 *
 * @param force - true면 쿨다운 무시 (수동 재시도 버튼용)
 */
export async function analyzeAndSave(params: {
  supabaseUrl: string;
  supabaseServiceKey: string;
  anthropicApiKey: string;
  postId: number;
  content: string;
  title?: string;
  force?: boolean;
}): Promise<AnalyzeResult> {
  const {
    supabaseUrl,
    supabaseServiceKey,
    anthropicApiKey,
    postId,
    content,
    title,
    force = false,
  } = params;

  const text = stripHtml(content);
  if (text.length < 10) {
    return { ok: true, skipped: 'content_too_short' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 쿨다운: 60초 이내 재분석 방지 (연속 수정 시 비용 보호)
  if (!force) {
    const { data: existing } = await supabase
      .from('post_analysis')
      .select('analyzed_at')
      .eq('post_id', postId)
      .maybeSingle();

    if (existing?.analyzed_at) {
      const diffMs = Date.now() - new Date(existing.analyzed_at).getTime();
      if (diffMs < COOLDOWN_MS) {
        return { ok: true, skipped: 'cooldown_60s' };
      }
    }
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-4-5-20251001';

  // 제목이 있으면 포함해 분석 정확도 향상 (최대 2000자 유지)
  const inputText = title ? `제목: ${title}\n\n내용: ${text.slice(0, 1900)}` : text.slice(0, 2000);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `다음 게시글에서 느껴지는 감정을 아래 목록에서만 골라 JSON 배열로만 답해줘. 다른 말 없이 ["감정1", "감정2"] 형태로만. 최대 3개.
감정 목록: ${EMOTIONS_LIST}

${inputText}`,
      },
    ],
  });

  const textBlock = message.content.find((c) => c.type === 'text');
  const raw = textBlock && 'text' in textBlock ? textBlock.text : '';

  let emotions: string[] = [];
  try {
    const parsed = JSON.parse(raw.trim()) as unknown;
    emotions = Array.isArray(parsed)
      ? parsed
          .filter((e): e is string => typeof e === 'string' && VALID_EMOTIONS.has(e))
          .slice(0, 3)
      : [];
  } catch {
    // JSON 파싱 실패 시 빈 배열로 저장
  }

  const { error } = await supabase
    .from('post_analysis')
    .upsert(
      { post_id: postId, emotions, analyzed_at: new Date().toISOString() },
      { onConflict: 'post_id' },
    );

  if (error) {
    console.error('[analyze] post_analysis upsert 오류:', error);
    return { ok: false, reason: error.message };
  }

  return { ok: true, emotions };
}
