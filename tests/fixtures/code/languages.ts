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

const keyword = '#cf8e6d';
const string = '#6aab73';
const comment = '#8c919a';
const type = '#bcbec4';
const className = '#abcae7';
const callable = '#56a8f5';
const property = '#c77dbb';
const annotation = '#b3ae60';

export const languageFixtures: readonly LanguageFixture[] = [
  { id: 'plaintext', label: 'Plain Text', code: 'const text = "한글"; // plain', tokens: [],
    indent: { before: '  text', spaces: 2 } },
  { id: 'java', label: 'Java', code: '@Service\n@Profile("!prod")\nclass Demo {\n  @Override\n  String label() { return helper(); }\n  String helper() { return "한글"; } // note\n}',
    tokens: [['@Service', annotation], ['@Profile', annotation], ['@Override', annotation], ['"!prod"', string],
      ['class', keyword], ['Demo', className], ['String', type], ['label', callable], ['"한글"', string], ['// note', comment]],
    indent: { before: 'class Demo {', spaces: 2 }, comment: '//' },
  { id: 'kotlin', label: 'Kotlin', code: 'fun demo() {\n  val text = "한글" // note\n}',
    tokens: [['fun', keyword], ['"한글"', string], ['// note', comment]],
    indent: { before: 'fun demo() {', spaces: 2 }, comment: '//' },
  { id: 'javascript', label: 'JavaScript', code: 'class Demo {}\nfunction demo() {\n  return "한글"; // note\n}\ndemo();',
    tokens: [['return', keyword], ['Demo', className], ['demo', callable], ['"한글"', string], ['// note', comment]],
    indent: { before: 'function demo() {', spaces: 2 }, comment: '//' },
  { id: 'typescript', label: 'TypeScript', code: 'interface Demo {\n  text: "한글"; // note\n}\nfunction label(value: Demo) { return value.text; }',
    tokens: [['interface', keyword], ['Demo', type], ['label', callable], ['"한글"', string], ['// note', comment]],
    indent: { before: 'interface Demo {', spaces: 2 }, comment: '//' },
  { id: 'python', label: 'Python', code: 'class Demo:\n  pass\ndef demo():\n  return "한글" # note\ndemo()',
    tokens: [['return', keyword], ['Demo', className], ['demo', callable], ['"한글"', string], ['# note', comment]],
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
