import test from 'tape';
import { parseArelleLog } from '../arelleValidator';

test('parseArelleLog: empty input → no issues', (t) => {
  t.deepEqual(parseArelleLog(''), []);
  t.deepEqual(parseArelleLog('<logEntries></logEntries>'), []);
  t.end();
});

test('parseArelleLog: single error entry', (t) => {
  const xml = `<?xml version="1.0"?>
<logEntries>
  <entry level="ERROR" code="xbrl.5.1.4">
    <message>Context entity identifier missing</message>
  </entry>
</logEntries>`;
  const issues = parseArelleLog(xml);
  t.equal(issues.length, 1);
  t.equal(issues[0].severity, 'error');
  t.equal(issues[0].code, 'xbrl.5.1.4');
  t.equal(issues[0].message, 'Context entity identifier missing');
  t.end();
});

test('parseArelleLog: mixed severities', (t) => {
  const xml = `<logEntries>
  <entry level="ERROR" code="E1"><message>err</message></entry>
  <entry level="WARNING" code="W1"><message>warn</message></entry>
  <entry level="INFO"><message>info text</message></entry>
</logEntries>`;
  const issues = parseArelleLog(xml);
  t.equal(issues.length, 3);
  t.equal(issues[0].severity, 'error');
  t.equal(issues[1].severity, 'warning');
  t.equal(issues[2].severity, 'info');
  t.end();
});

test('parseArelleLog: refs collected from href attributes', (t) => {
  const xml = `<logEntries>
  <entry level="ERROR" code="X">
    <message>missing</message>
    <ref href="/path/to/foo.xbrl" />
    <ref href="/path/to/bar.xsd" />
  </entry>
</logEntries>`;
  const issues = parseArelleLog(xml);
  t.deepEqual(issues[0].refs, ['/path/to/foo.xbrl', '/path/to/bar.xsd']);
  t.end();
});

test('parseArelleLog: XML entities in message body decoded', (t) => {
  const xml = `<logEntries>
  <entry level="ERROR">
    <message>Got &amp; expected &lt;tag&gt;</message>
  </entry>
</logEntries>`;
  const issues = parseArelleLog(xml);
  t.equal(issues[0].message, 'Got & expected <tag>');
  t.end();
});

test('parseArelleLog: unknown level → severity unknown', (t) => {
  const xml = `<logEntries>
  <entry level="CRITICAL"><message>x</message></entry>
</logEntries>`;
  const issues = parseArelleLog(xml);
  t.equal(issues[0].severity, 'unknown');
  t.end();
});

test('parseArelleLog: missing message falls back to stripped inner', (t) => {
  const xml = `<logEntries>
  <entry level="ERROR">plain text content</entry>
</logEntries>`;
  const issues = parseArelleLog(xml);
  t.equal(issues[0].message, 'plain text content');
  t.end();
});
