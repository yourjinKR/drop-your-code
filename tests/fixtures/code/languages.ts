import type { LanguageId } from '../../../src/state/workspace';

type LanguageFixture = {
  id: LanguageId;
  label: string;
  code: string;
  /** Complete DOM tokens with expected colors for representative syntax categories. */
  tokens: readonly (readonly [string, string])[];
  /** Enter is pressed after the last character of `before`. */
  indent: { before: string; spaces: number };
  comment?: string | readonly [string, string];
};

const keyword = '#d7a9f0';
const string = '#acd69e';
const comment = '#a2adbd';
const type = '#99c7ff';
const property = '#91dfd4';

export const languageFixtures: readonly LanguageFixture[] = [
  { id: 'plaintext', label: 'Plain Text', code: 'const text = "한글"; // plain', tokens: [],
    indent: { before: '  text', spaces: 2 } },
  { id: 'java', label: 'Java', code: 'class Demo {\n  String text = "한글"; // note\n}',
    tokens: [['class', keyword], ['"한글"', string], ['// note', comment]],
    indent: { before: 'class Demo {', spaces: 2 }, comment: '//' },
  { id: 'kotlin', label: 'Kotlin', code: 'fun demo() {\n  val text = "한글" // note\n}',
    tokens: [['fun', keyword], ['"한글"', string], ['// note', comment]],
    indent: { before: 'fun demo() {', spaces: 2 }, comment: '//' },
  { id: 'javascript', label: 'JavaScript', code: 'function demo() {\n  return "한글"; // note\n}',
    tokens: [['return', keyword], ['"한글"', string], ['// note', comment]],
    indent: { before: 'function demo() {', spaces: 2 }, comment: '//' },
  { id: 'typescript', label: 'TypeScript', code: 'interface Demo {\n  text: "한글"; // note\n}',
    tokens: [['interface', keyword], ['"한글"', string], ['// note', comment]],
    indent: { before: 'interface Demo {', spaces: 2 }, comment: '//' },
  { id: 'python', label: 'Python', code: 'def demo():\n  return "한글" # note',
    tokens: [['return', keyword], ['"한글"', string], ['# note', comment]],
    indent: { before: 'def demo():', spaces: 2 }, comment: '#' },
  { id: 'sql', label: 'SQL', code: "SELECT '한글'; -- note",
    tokens: [['SELECT', keyword], ["'한글'", string], ['-- note', comment]],
    indent: { before: '  SELECT 1;', spaces: 0 }, comment: '--' },
  { id: 'json', label: 'JSON', code: '{\n  "text": "한글"\n}',
    tokens: [['"text"', property], ['"한글"', string]],
    indent: { before: '{', spaces: 2 } },
  { id: 'yaml', label: 'YAML', code: 'demo:\n  text: "한글" # note',
    tokens: [['text', property], ['"한글"', string], ['# note', comment]],
    indent: { before: '  text: "한글"', spaces: 2 }, comment: '#' },
  { id: 'html', label: 'HTML', code: '<div title="한글">Hi</div>\n<!-- note -->',
    tokens: [['div', type], ['"한글"', string], ['<!-- note -->', comment]],
    indent: { before: '<div>', spaces: 2 }, comment: ['<!--', '-->'] },
  { id: 'css', label: 'CSS', code: 'div {\n  content: "한글"; /* note */\n}',
    tokens: [['content', property], ['"한글"', string], ['/* note */', comment]],
    indent: { before: 'div {', spaces: 2 }, comment: ['/*', '*/'] },
  { id: 'xml', label: 'XML', code: '<item name="한글">Hi</item>\n<!-- note -->',
    tokens: [['item', type], ['"한글"', string], ['<!-- note -->', comment]],
    indent: { before: '<item>', spaces: 2 }, comment: ['<!--', '-->'] },
  { id: 'shell', label: 'Shell', code: 'if true; then\n  echo "한글" # note\nfi',
    tokens: [['if', keyword], ['"한글"', string], ['# note', comment]],
    indent: { before: '  echo "한글"', spaces: 2 }, comment: '#' },
  { id: 'markdown', label: 'Markdown', code: '# 한글\n\n<!-- note -->',
    tokens: [['# 한글', type], ['<!-- note -->', comment]],
    indent: { before: '  text', spaces: 2 }, comment: ['<!--', '-->'] },
];
