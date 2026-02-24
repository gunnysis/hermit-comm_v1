import React, { Component, memo, useCallback, useMemo, type ReactNode } from 'react';
import { Linking, useWindowDimensions, Image } from 'react-native';
import { Text } from 'react-native';
import RenderHTML, { type CustomRendererProps } from 'react-native-render-html';
import type { TBlock } from '@native-html/transient-render-engine';
import { isLikelyHtml, stripHtml } from '@/shared/utils/html';
import { logger } from '@/shared/utils/logger';
import { CONTENT_MAX_WIDTH } from '@/shared/hooks/useResponsiveLayout';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

/** http/https만 허용 (링크 열기·이미지 src) */
function isAllowedUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\//i.test(url.trim());
}

/** 렌더 시 XSS·불필요 태그 차단. 허용: p, strong, em, u, s, blockquote, ul, ol, li, br, code, pre, h2, h3, span, a(링크), img(이미지) 등. */
const IGNORED_DOM_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'style',
  'link',
  'meta',
  'head',
  'title',
  'svg',
];

interface PostBodyProps {
  content: string;
  imageUrl?: string | null;
}

/** RenderHTML 렌더 실패 시 plain 텍스트로 fallback */
class PostBodyHtmlErrorBoundary extends Component<
  { content: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('[PostBody] RenderHTML 에러', error?.message, errorInfo?.componentStack);
    logger.error('[PostBody] HTML 렌더 실패, plain fallback', this.props.content.slice(0, 200));
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Text
          className="text-base text-gray-800 dark:text-stone-100"
          style={{ lineHeight: 24 }}
          selectable>
          {stripHtml(this.props.content)}
        </Text>
      );
    }
    return this.props.children;
  }
}

const IMG_MAX_HEIGHT = 360;

function useHtmlStyles() {
  const { text, textMuted, codeBackground, link } = useThemeColors();

  return useMemo(
    () => ({
      tagsStyles: {
        body: { color: text, fontSize: 16, lineHeight: 24 },
        p: { marginTop: 0, marginBottom: 12, lineHeight: 24 },
        blockquote: {
          backgroundColor: codeBackground,
          borderLeftWidth: 4,
          borderLeftColor: '#FFCF33',
          marginVertical: 8,
          paddingLeft: 12,
          paddingVertical: 8,
        },
        code: {
          backgroundColor: codeBackground,
          fontFamily: 'monospace',
          paddingHorizontal: 6,
          paddingVertical: 2,
        },
        pre: { backgroundColor: codeBackground, padding: 12, marginVertical: 8 },
        h2: { fontSize: 20, fontWeight: '700' as const, marginVertical: 8 },
        h3: { fontSize: 18, fontWeight: '600' as const, marginVertical: 6 },
        a: { color: link, textDecorationLine: 'underline' as const },
        img: { maxWidth: '100%' as const, maxHeight: IMG_MAX_HEIGHT },
      },
      baseStyle: { color: text, fontSize: 16, lineHeight: 24 },
      placeholderStyle: { fontSize: 14, color: textMuted, fontStyle: 'italic' as const },
    }),
    [text, textMuted, codeBackground, link],
  );
}

/** img: http/https src만 렌더, 그 외는 placeholder */
function SafeImageRenderer(props: CustomRendererProps<TBlock>): React.ReactElement {
  const { tnode, InternalRenderer } = props;
  const { placeholderStyle } = useHtmlStyles();
  const attrs = tnode.attributes ?? {};
  const src = typeof attrs.src === 'string' ? attrs.src : '';
  if (!isAllowedUrl(src)) {
    if (__DEV__) logger.warn('[PostBody] 이미지 src 차단', String(src).slice(0, 80));
    return (
      <Text style={placeholderStyle} accessibilityLabel="표시할 수 없는 이미지">
        (이미지)
      </Text>
    );
  }
  return <InternalRenderer {...props} />;
}

function PostBodyComponent({ content, imageUrl }: PostBodyProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(Math.max(0, width - 32), CONTENT_MAX_WIDTH);
  const htmlStyles = useHtmlStyles();

  const handleLinkPress = useCallback((_event: unknown, href: string) => {
    const url = typeof href === 'string' ? href : '';
    if (!url || !isAllowedUrl(url)) {
      if (__DEV__) logger.warn('[PostBody] 링크 스킴 차단', url.slice(0, 80));
      return;
    }
    Linking.openURL(url).catch((err) => {
      if (__DEV__) logger.error('[PostBody] 링크 열기 실패', url.slice(0, 80), err);
    });
  }, []);

  const renderersProps = useMemo(
    () => ({
      a: { onPress: handleLinkPress },
      img: {
        initialDimensions: { width: contentWidth, height: IMG_MAX_HEIGHT },
      },
    }),
    [handleLinkPress, contentWidth],
  );

  const renderers = useMemo(() => ({ img: SafeImageRenderer }), []);

  const bodyContent =
    !content || !content.trim() ? (
      <Text
        className="text-base text-gray-500 dark:text-stone-400"
        style={{ lineHeight: 24 }}
        accessibilityLabel="게시글 본문 없음">
        내용 없음
      </Text>
    ) : isLikelyHtml(content) ? (
      <PostBodyHtmlErrorBoundary content={content}>
        <RenderHTML
          source={{ html: content }}
          contentWidth={contentWidth}
          tagsStyles={htmlStyles.tagsStyles}
          baseStyle={htmlStyles.baseStyle}
          ignoredDomTags={IGNORED_DOM_TAGS}
          renderers={renderers}
          renderersProps={renderersProps}
        />
      </PostBodyHtmlErrorBoundary>
    ) : (
      <Text
        className="text-base text-gray-800 dark:text-stone-100"
        style={{ lineHeight: 24 }}
        selectable>
        {content}
      </Text>
    );

  return (
    <>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="w-full aspect-video rounded-xl mb-3 bg-stone-100 dark:bg-stone-800"
          resizeMode="cover"
          accessibilityLabel="게시글 첨부 이미지"
        />
      ) : null}
      {bodyContent}
    </>
  );
}

export const PostBody = memo(PostBodyComponent);
