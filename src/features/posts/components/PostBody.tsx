import React, { Component, memo, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { Text } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { isLikelyHtml, stripHtml } from '@/shared/utils/html';

/** 렌더 시 XSS·불필요 태그 차단. 허용: p, strong, em, u, s, blockquote, ul, ol, li, br, code, pre, h2, h3, span 등 기본만. */
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
  'img',
  'a',
];

interface PostBodyProps {
  content: string;
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

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Text className="text-base text-gray-800" style={{ lineHeight: 24 }} selectable>
          {stripHtml(this.props.content)}
        </Text>
      );
    }
    return this.props.children;
  }
}

const HTML_STYLE = {
  body: {
    color: '#1f2937',
    fontSize: 16,
    lineHeight: 24,
  },
  p: {
    marginTop: 0,
    marginBottom: 12,
    lineHeight: 24,
  },
  blockquote: {
    backgroundColor: '#FFFCEB',
    borderLeftWidth: 4,
    borderLeftColor: '#FFCF33',
    marginVertical: 8,
    paddingLeft: 12,
    paddingVertical: 8,
  },
  code: {
    backgroundColor: '#FFFCEB',
    fontFamily: 'monospace',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pre: {
    backgroundColor: '#FFFCEB',
    padding: 12,
    marginVertical: 8,
  },
  h2: { fontSize: 20, fontWeight: '700' as const, marginVertical: 8 },
  h3: { fontSize: 18, fontWeight: '600' as const, marginVertical: 6 },
};

function PostBodyComponent({ content }: PostBodyProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(0, width - 32);

  if (!content || !content.trim()) {
    return (
      <Text
        className="text-base text-gray-500"
        style={{ lineHeight: 24 }}
        accessibilityLabel="게시글 본문 없음">
        내용 없음
      </Text>
    );
  }

  if (isLikelyHtml(content)) {
    return (
      <PostBodyHtmlErrorBoundary content={content}>
        <RenderHTML
          source={{ html: content }}
          contentWidth={contentWidth}
          tagsStyles={HTML_STYLE}
          baseStyle={{ color: '#1f2937', fontSize: 16, lineHeight: 24 }}
          ignoredDomTags={IGNORED_DOM_TAGS}
        />
      </PostBodyHtmlErrorBoundary>
    );
  }

  return (
    <Text className="text-base text-gray-800" style={{ lineHeight: 24 }} selectable>
      {content}
    </Text>
  );
}

export const PostBody = memo(PostBodyComponent);
