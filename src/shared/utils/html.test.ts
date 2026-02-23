import { stripHtml, getExcerpt, isLikelyHtml } from './html';

describe('stripHtml', () => {
  it('빈 문자열이면 빈 문자열 반환', () => {
    expect(stripHtml('')).toBe('');
  });

  it('HTML 태그를 제거하고 공백으로 치환', () => {
    expect(stripHtml('<p>hello</p>')).toBe('hello');
    expect(stripHtml('<strong>굵게</strong>')).toBe('굵게');
    expect(stripHtml('<p>a</p><p>b</p>')).toBe('a b');
  });

  it('연속 공백은 하나로', () => {
    expect(stripHtml('  a   b  ').trim()).toBe('a b');
  });

  it('HTML 엔티티를 디코딩한다', () => {
    expect(stripHtml('a&nbsp;b')).toBe('a b');
    expect(stripHtml('&lt;script&gt;')).toBe('<script>');
    expect(stripHtml('&amp;')).toBe('&');
    expect(stripHtml('&quot;text&quot;')).toBe('"text"');
    expect(stripHtml('&#39;')).toBe("'");
  });
});

describe('getExcerpt', () => {
  it('maxLen 이하면 그대로 반환', () => {
    expect(getExcerpt('짧은 글', 100)).toBe('짧은 글');
    expect(getExcerpt('가나다', 3)).toBe('가나다');
  });

  it('maxLen 초과면 잘라서 말줄임', () => {
    expect(getExcerpt('가나다라마', 3)).toBe('가나다…');
    expect(getExcerpt('hello world', 5)).toBe('hello…');
  });

  it('HTML이 있으면 stripHtml 후 자름', () => {
    expect(getExcerpt('<p>가나다라마</p>', 3)).toBe('가나다…');
  });

  it('strip 결과가 비어 있으면 "내용 없음" 반환', () => {
    expect(getExcerpt('', 100)).toBe('내용 없음');
    expect(getExcerpt('<img src="x">', 100)).toBe('내용 없음');
    expect(getExcerpt('   ', 100)).toBe('내용 없음');
  });
});

describe('isLikelyHtml', () => {
  it('빈 문자열이면 false', () => {
    expect(isLikelyHtml('')).toBe(false);
  });

  it('HTML 태그가 있으면 true', () => {
    expect(isLikelyHtml('<p>text</p>')).toBe(true);
    expect(isLikelyHtml('<strong>bold</strong>')).toBe(true);
    expect(isLikelyHtml('앞 <em>기울임</em> 뒤')).toBe(true);
  });

  it('<br> 및 자기닫힘 태그를 감지한다', () => {
    expect(isLikelyHtml('<br>')).toBe(true);
    expect(isLikelyHtml('<br/>')).toBe(true);
    expect(isLikelyHtml('<br />')).toBe(true);
    expect(isLikelyHtml('<img src="x"/>')).toBe(true);
  });

  it('닫는 태그도 감지한다', () => {
    expect(isLikelyHtml('</p>')).toBe(true);
    expect(isLikelyHtml('</strong>')).toBe(true);
  });

  it('태그가 없으면 false', () => {
    expect(isLikelyHtml('plain text')).toBe(false);
    expect(isLikelyHtml('꺾쇠만 < 있음')).toBe(false);
  });
});
