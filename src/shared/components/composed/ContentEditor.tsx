import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  useEditorContent,
  TenTapStartKit,
} from '@10play/tentap-editor';

const DEFAULT_MAX_LENGTH = 5000;

export interface ContentEditorProps {
  /** HTML 문자열 (초기값·수정 시 불러온 값) */
  value: string;
  /** HTML 변경 시 호출 */
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  editable?: boolean;
  label?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** 최소 높이 (툴바+에디터 영역) */
  minHeight?: number;
}

/** HTML 태그/엔티티를 제거한 순수 텍스트 길이 */
function textLength(html: string): number {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:[a-z]+|#\d+|#x[\da-f]+);/gi, 'X')
    .trim().length;
}

export function ContentEditor({
  value,
  onChange,
  placeholder,
  error,
  maxLength = DEFAULT_MAX_LENGTH,
  editable = true,
  label,
  accessibilityLabel = label,
  accessibilityHint,
  minHeight = 200,
}: ContentEditorProps) {
  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    dynamicHeight: true,
    editable,
    initialContent: value || '',
    bridgeExtensions: TenTapStartKit,
  });

  const htmlContent = useEditorContent(editor, {
    type: 'html',
    debounceInterval: 300,
  });

  const currentLength =
    typeof htmlContent === 'string' ? textLength(htmlContent) : textLength(value);
  const isOverLimit = currentLength > maxLength;
  const charPercent = Math.min((currentLength / maxLength) * 100, 100);
  const readTimeMin = Math.max(1, Math.ceil(currentLength / 500));

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (htmlContent !== undefined) {
      onChange(typeof htmlContent === 'string' ? htmlContent.trim() : '');
    }
  }, [htmlContent, onChange]);

  return (
    <View
      className="mb-4"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="none">
      {label ? (
        <Text className="text-sm font-semibold text-gray-700 dark:text-stone-300 mb-2">
          {label}
        </Text>
      ) : null}
      <View
        className={`
          rounded-2xl border-2 overflow-hidden
          ${error ? 'border-coral-500' : 'border-cream-200 dark:border-stone-600'}
        `}
        style={{ minHeight }}>
        <View className="bg-cream-100 dark:bg-stone-800 border-b border-cream-200 dark:border-stone-600 px-2 py-1">
          <Toolbar editor={editor} />
        </View>
        <View
          className="bg-cream-50 dark:bg-stone-900 flex-1"
          style={{ minHeight: 180, maxHeight: 600 }}>
          <RichText editor={editor} />
        </View>
      </View>

      {/* 하단 바: 읽기 시간 + 글자수 + 프로그레스 바 */}
      <View className="flex-row items-center justify-between mt-1.5 px-1">
        <Text className="text-xs text-gray-400 dark:text-stone-500">
          {currentLength > 0 ? `약 ${readTimeMin}분 읽기` : ''}
        </Text>
        <View className="flex-row items-center">
          <Text
            className={`text-xs ${isOverLimit ? 'text-coral-500' : 'text-gray-500 dark:text-stone-400'}`}
            accessibilityLabel={`글자 수 ${currentLength}자, 최대 ${maxLength}자`}>
            {currentLength} / {maxLength}자
          </Text>
          {charPercent > 0 && (
            <View className="ml-2 w-10 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
              <View
                className={`h-full rounded-full ${
                  isOverLimit ? 'bg-coral-500' : charPercent > 80 ? 'bg-amber-400' : 'bg-stone-400'
                }`}
                style={{ width: `${charPercent}%` }}
              />
            </View>
          )}
        </View>
      </View>

      {error ? (
        <Text className="text-xs text-coral-500 dark:text-coral-400 mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
