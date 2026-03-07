import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { SEARCH_HIGHLIGHT } from '@/shared/lib/constants';

interface HighlightTextProps {
  text: string;
  highlightStyle?: TextStyle;
  style?: TextStyle;
  className?: string;
  numberOfLines?: number;
}

/** <<...>> 구분자로 감싼 텍스트를 하이라이트 렌더링 */
function HighlightTextComponent({
  text,
  highlightStyle,
  style,
  className,
  numberOfLines,
}: HighlightTextProps) {
  const parts = parseHighlight(text);

  return (
    <Text style={style} className={className} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.highlighted ? (
          <Text
            key={i}
            style={[
              { fontWeight: '700', backgroundColor: SEARCH_HIGHLIGHT.light },
              highlightStyle,
            ]}>
            {part.text}
          </Text>
        ) : (
          <Text key={i}>{part.text}</Text>
        ),
      )}
    </Text>
  );
}

function parseHighlight(text: string): { text: string; highlighted: boolean }[] {
  const parts: { text: string; highlighted: boolean }[] = [];
  const regex = /<<(.*?)>>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlighted: false });
    }
    parts.push({ text: match[1], highlighted: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlighted: false });
  }

  return parts.length > 0 ? parts : [{ text, highlighted: false }];
}

HighlightTextComponent.displayName = 'HighlightText';
export const HighlightText = React.memo(HighlightTextComponent);
