'use client'

import { isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { freshDb, loadSql, runSql, type SqlDatabase } from './sqlEngine'

// Runs real PHP 8.3 in the browser (php-wasm, vendored in /public/phpwasm) and simulates a tiny web
// server around it: each Run or form submission is an HTTP request with its own $_GET/$_POST/$_COOKIE,
// sessions persist between requests, header('Location: …') redirects are followed, and the page the
// script outputs is shown in a sandboxed "browser" whose forms and links send new requests.

interface PhpEngine {
  addEventListener(type: 'output' | 'error', cb: (e: Event & { detail: string }) => void): void
  run(code: string): Promise<unknown>
  refresh(): Promise<unknown>
}

let enginePromise: Promise<PhpEngine> | null = null
let sink: string[] | null = null
let queue: Promise<unknown> = Promise.resolve()

function loadEngine(): Promise<PhpEngine> {
  if (!enginePromise) {
    const url = '/phpwasm/PhpWeb.mjs'
    enginePromise = import(/* webpackIgnore: true */ url).then(async (m: { PhpWeb: new (a: object) => PhpEngine }) => {
      // php-wasm asks for an optional libxml2.so via a data: URL, which the site's CSP (connect-src 'self')
      // blocks; an empty same-origin stub gives it the same "not available" answer without a CSP error.
      const php = new m.PhpWeb({ version: '8.3', locateFile: (f: string) => (f === 'libxml2.so' ? '/phpwasm/libxml2-stub.so' : undefined) })
      php.addEventListener('output', e => sink?.push(e.detail))
      php.addEventListener('error', e => sink?.push(e.detail))
      await php.run('<?php ')
      return php
    })
    enginePromise.catch(() => (enginePromise = null))
  }
  return enginePromise
}

// One PHP runtime is shared by every playground on the page, so requests run one at a time.
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const p = queue.then(fn, fn)
  queue = p.catch(() => undefined)
  return p
}

// Each playground with a ```sql block gets its own in-browser database, reached from PHP via vrzno.
const dbs = new Map<string, SqlDatabase>()
function installSqlBridge() {
  const w = window as unknown as { __studyosSql?: (pg: string, sql: string, params: string) => string }
  if (w.__studyosSql) return
  w.__studyosSql = (pg, sql, params) => {
    const db = dbs.get(pg)
    if (!db) return JSON.stringify({ error: "Can't connect to MySQL server on 'localhost' (this example has no database)", errno: 2002, sqlstate: 'HY000', errclass: 'General error' })
    let p: unknown = []
    try {
      p = JSON.parse(params)
    } catch {
      /* no parameters */
    }
    return JSON.stringify(runSql(db, sql, p))
  }
}

interface TableView {
  name: string
  columns: string[]
  rows: unknown[][]
  count: number
}
function snapshot(db: SqlDatabase): TableView[] {
  const names = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")[0]?.values.map(v => String(v[0])) ?? []
  return names.map(name => {
    const data = db.exec(`SELECT * FROM "${name}" LIMIT 30`)[0]
    const columns = data?.columns ?? db.exec(`PRAGMA table_info("${name}")`)[0]?.values.map(v => String(v[1])) ?? []
    const count = Number(db.exec(`SELECT COUNT(*) FROM "${name}"`)[0]?.values[0]?.[0] ?? 0)
    return { name, columns, rows: data?.values ?? [], count }
  })
}

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)))
const q = (s: string) => JSON.stringify(s)

interface ServerFile {
  n: string
  s: number
  t?: string
}
interface Meta {
  h: string[]
  code: number | false
  files: ServerFile[]
}

interface Request {
  method: string
  path: string
  query: string
  // URL-encoded form fields (become $_POST); rawBody is what php://input returns
  body: string
  rawBody?: string
  contentType?: string
}

// Defined at the start of every simulated request (each request starts from a fresh PHP runtime).
// - exit/die are rewritten, with PHP's own tokenizer so strings are untouched, into a throw the wrapper
//   catches: a real exit would stop the wrapper from saving the session and reporting headers.
// - This PHP build has no MySQL driver, so `new PDO(...)` is rewritten to a PDO subclass and the mysqli
//   API is defined in PHP; both send SQL through the vrzno bridge to window.__studyosSql (sql.js, with
//   MySQL-style error messages), giving each playground its own persistent in-browser database.
const PHP_RUNTIME = String.raw`
if (!class_exists('__PgExit', false)) { final class __PgExit extends \Error { public $out = ''; public function __construct($o = '') { parent::__construct('exit'); $this->out = is_string($o) ? $o : ''; } } }
if (!function_exists('__pg_prepare')) { function __pg_prepare($src) {
  $out = ''; $t = token_get_all($src); $n = count($t); $prev = null;
  for ($i = 0; $i < $n; $i++) { $k = $t[$i];
    if (is_array($k) && $k[0] === T_EXIT) { $out .= 'throw new \__PgExit'; $j = $i + 1;
      while ($j < $n && is_array($t[$j]) && $t[$j][0] === T_WHITESPACE) $j++;
      if (!($j < $n && $t[$j] === '(')) $out .= '()'; $prev = T_STRING; continue; }
    if (is_array($k) && ($k[0] === T_STRING || $k[0] === T_NAME_FULLY_QUALIFIED) && strtolower(ltrim($k[1], '\\')) === 'pdo' && $prev === T_NEW) { $out .= '\__PgPDO'; $prev = T_STRING; continue; }
    if (is_array($k) && $k[0] === T_CONSTANT_ENCAPSED_STRING && strtolower(substr($k[1], 1, -1)) === 'php://input') { $out .= "'/tmp/pgbody'"; $prev = T_CONSTANT_ENCAPSED_STRING; continue; }
    $out .= is_array($k) ? $k[1] : $k;
    if (!(is_array($k) && in_array($k[0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true))) $prev = is_array($k) ? $k[0] : $k; }
  return $out; } }

if (!class_exists('__PgPDO', false)) {
function __pg_sql($sql, $params) {
  static $w = null; if ($w === null) $w = new Vrzno;
  $r = json_decode((string) $w->__studyosSql(__PG_ID, (string) $sql, json_encode($params ?? [], JSON_INVALID_UTF8_SUBSTITUTE)), true);
  return is_array($r) ? $r : ['error' => 'Lost connection to MySQL server', 'errno' => 2013, 'sqlstate' => 'HY000', 'errclass' => 'General error'];
}
function __pg_shape(array $cols, array $row, $mode) {
  $assoc = []; foreach ($cols as $i => $c) $assoc[$c] = $row[$i];
  if ($mode == \PDO::FETCH_ASSOC) return $assoc;
  if ($mode == \PDO::FETCH_NUM) return array_values($row);
  if ($mode == \PDO::FETCH_OBJ) return (object) $assoc;
  $both = []; foreach ($cols as $i => $c) { $both[$c] = $row[$i]; $both[$i] = $row[$i]; } return $both;
}
final class __PgStmt implements \IteratorAggregate {
  public $queryString; private $pdo; private $cols = []; private $rows = []; private $pos = 0; private $count = 0; private $bound = []; private $mode;
  public function __construct($pdo, $sql) { $this->pdo = $pdo; $this->queryString = $sql; $this->mode = $pdo->getAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE) ?? \PDO::FETCH_BOTH; }
  public function bindValue($param, $value, $type = \PDO::PARAM_STR) { $this->bound[$param] = $value; return true; }
  public function bindParam($param, &$var, $type = \PDO::PARAM_STR, $length = 0, $options = null) { $this->bound[$param] = &$var; return true; }
  public function execute($params = null) {
    if ($params === null) { $params = []; foreach ($this->bound as $k => $v) $params[$k] = $v;
      if ($params && is_int(array_key_first($params))) { ksort($params); $params = array_values($params); } }
    $r = $this->pdo->__run($this->queryString, $params);
    if ($r === false) return false;
    $this->cols = $r['columns'] ?? []; $this->rows = $r['rows'] ?? []; $this->pos = 0; $this->count = $r['affected'] ?? 0;
    return true;
  }
  public function fetch($mode = null) { if ($this->pos >= count($this->rows)) return false; return __pg_shape($this->cols, $this->rows[$this->pos++], $mode ?? $this->mode); }
  public function fetchAll($mode = null, ...$args) { $mode = $mode ?? $this->mode; $out = [];
    while ($this->pos < count($this->rows)) { $row = $this->rows[$this->pos++]; $out[] = $mode == \PDO::FETCH_COLUMN ? ($row[$args[0] ?? 0] ?? null) : __pg_shape($this->cols, $row, $mode); }
    return $out; }
  public function fetchColumn($column = 0) { if ($this->pos >= count($this->rows)) return false; return $this->rows[$this->pos++][$column] ?? null; }
  public function fetchObject($class = 'stdClass') { $r = $this->fetch(\PDO::FETCH_ASSOC); return $r === false ? false : (object) $r; }
  public function rowCount() { return $this->count; }
  public function columnCount() { return count($this->cols); }
  public function setFetchMode($mode, ...$args) { $this->mode = $mode; return true; }
  public function closeCursor() { return true; }
  public function getIterator(): \Iterator { while (($row = $this->fetch()) !== false) yield $row; }
}
class __PgPDO extends \PDO {
  private $attrs = []; private $last = '0'; private $tx = false; private $err = ['00000', null, null];
  public function __construct($dsn = '', $username = null, $password = null, $options = null) {
    $this->attrs[\PDO::ATTR_ERRMODE] = \PDO::ERRMODE_EXCEPTION; $this->attrs[\PDO::ATTR_DEFAULT_FETCH_MODE] = \PDO::FETCH_BOTH;
    foreach ((array) $options as $k => $v) $this->attrs[$k] = $v;
    if (!preg_match('/^mysql:/i', (string) $dsn)) throw new \PDOException('could not find driver');
  }
  #[\ReturnTypeWillChange] public function prepare($query, $options = []) { return new __PgStmt($this, $query); }
  #[\ReturnTypeWillChange] public function query($query, $fetchMode = null, ...$args) { $s = new __PgStmt($this, $query); if ($fetchMode !== null) $s->setFetchMode($fetchMode); return $s->execute() ? $s : false; }
  #[\ReturnTypeWillChange] public function exec($statement) { $r = $this->__run($statement, []); return $r === false ? false : ($r['affected'] ?? 0); }
  #[\ReturnTypeWillChange] public function lastInsertId($name = null) { return $this->last; }
  #[\ReturnTypeWillChange] public function setAttribute($attribute, $value) { $this->attrs[$attribute] = $value; return true; }
  #[\ReturnTypeWillChange] public function getAttribute($attribute) { return $this->attrs[$attribute] ?? null; }
  #[\ReturnTypeWillChange] public function beginTransaction() { $this->__run('BEGIN', []); $this->tx = true; return true; }
  #[\ReturnTypeWillChange] public function commit() { $this->__run('COMMIT', []); $this->tx = false; return true; }
  #[\ReturnTypeWillChange] public function rollBack() { $this->__run('ROLLBACK', []); $this->tx = false; return true; }
  #[\ReturnTypeWillChange] public function inTransaction() { return $this->tx; }
  #[\ReturnTypeWillChange] public function quote($string, $type = \PDO::PARAM_STR) { return "'" . str_replace("'", "''", (string) $string) . "'"; }
  #[\ReturnTypeWillChange] public function errorInfo() { return $this->err; }
  #[\ReturnTypeWillChange] public function errorCode() { return $this->err[0]; }
  public function __run($sql, $params) {
    $r = __pg_sql($sql, $params);
    if (isset($r['error'])) {
      $this->err = [$r['sqlstate'], $r['errno'], $r['error']];
      $msg = 'SQLSTATE[' . $r['sqlstate'] . ']: ' . $r['errclass'] . ': ' . $r['errno'] . ' ' . $r['error'];
      $mode = $this->attrs[\PDO::ATTR_ERRMODE] ?? \PDO::ERRMODE_EXCEPTION;
      if ($mode == \PDO::ERRMODE_EXCEPTION) throw new \PDOException($msg);
      if ($mode == \PDO::ERRMODE_WARNING) trigger_error('PDO: ' . $msg, E_USER_WARNING);
      return false;
    }
    $this->err = ['00000', null, null];
    if (isset($r['insertId'])) $this->last = (string) $r['insertId'];
    return $r;
  }
}
}

if (!function_exists('mysqli_connect')) {
define('MYSQLI_ASSOC', 1); define('MYSQLI_NUM', 2); define('MYSQLI_BOTH', 3);
define('MYSQLI_REPORT_OFF', 0); define('MYSQLI_REPORT_ERROR', 1); define('MYSQLI_REPORT_STRICT', 2); define('MYSQLI_REPORT_INDEX', 4); define('MYSQLI_REPORT_ALL', 255);
class mysqli_sql_exception extends \RuntimeException {}
function __pg_mysqli_report($set = null) { static $flags = 3; if ($set !== null) $flags = $set; return $flags; }
function __pg_mshape(array $cols, array $row, $mode) {
  $assoc = []; foreach ($cols as $i => $c) $assoc[$c] = $row[$i];
  if ($mode === MYSQLI_ASSOC) return $assoc;
  if ($mode === MYSQLI_NUM) return array_values($row);
  $both = []; foreach ($cols as $i => $c) { $both[$i] = $row[$i]; $both[$c] = $row[$i]; } return $both;
}
final class mysqli_result implements \IteratorAggregate {
  public $num_rows = 0; public $field_count = 0; private $cols; private $rows; private $pos = 0;
  public function __construct(array $r) { $this->cols = $r['columns'] ?? []; $this->rows = $r['rows'] ?? []; $this->num_rows = count($this->rows); $this->field_count = count($this->cols); }
  public function fetch_array($mode = MYSQLI_BOTH) { return $this->pos < $this->num_rows ? __pg_mshape($this->cols, $this->rows[$this->pos++], $mode) : null; }
  public function fetch_assoc() { return $this->fetch_array(MYSQLI_ASSOC); }
  public function fetch_row() { return $this->fetch_array(MYSQLI_NUM); }
  public function fetch_object() { $r = $this->fetch_assoc(); return $r === null ? null : (object) $r; }
  public function fetch_all($mode = MYSQLI_NUM) { $out = []; while (($r = $this->fetch_array($mode)) !== null) $out[] = $r; return $out; }
  public function data_seek($i) { $this->pos = $i; return true; }
  public function free() {}
  public function close() {}
  public function getIterator(): \Iterator { while (($r = $this->fetch_assoc()) !== null) yield $r; }
}
final class mysqli_stmt {
  public $affected_rows = 0; public $insert_id = 0; public $num_rows = 0; public $error = ''; public $errno = 0; public $param_count = 0;
  private $conn; private $sql; private $types = ''; private $vars = []; private $res = null;
  public function __construct($conn, $sql) { $this->conn = $conn; $this->sql = $sql; $this->param_count = substr_count($sql, '?'); }
  public function bind_param($types, &...$vars) {
    if (strlen($types) !== count($vars)) throw new \ArgumentCountError('The number of elements in the type definition string must match the number of bind variables');
    if (count($vars) !== $this->param_count) throw new \ArgumentCountError('The number of variables must match the number of parameters in the prepared statement');
    $this->types = $types; $this->vars = $vars; return true;
  }
  public function execute($params = null) {
    $vals = [];
    if ($params !== null) $vals = array_values($params);
    else foreach ($this->vars as $i => $v) { $t = $this->types[$i]; $vals[] = $v === null ? null : ($t === 'i' ? (int) $v : ($t === 'd' ? (float) $v : (string) $v)); }
    $r = $this->conn->__run($this->sql, $vals, $this);
    if ($r === false) return false;
    $this->affected_rows = $r['affected'] ?? 0; $this->insert_id = $r['insertId'] ?? 0;
    $this->res = ($r['columns'] ?? []) ? $r : null; $this->num_rows = count($r['rows'] ?? []);
    return true;
  }
  public function get_result() { return $this->res ? new mysqli_result($this->res) : false; }
  public function store_result() { return true; }
  public function close() { return true; }
  public function free_result() {}
}
class mysqli {
  public $connect_error = null; public $connect_errno = 0; public $error = ''; public $errno = 0; public $affected_rows = 0; public $insert_id = 0; public $host_info = 'localhost via TCP/IP';
  public function __construct($hostname = null, $username = null, $password = null, $database = null, $port = null, $socket = null) {}
  public function query($query, $mode = 0) { $r = $this->__run($query, []); if ($r === false) return false; return ($r['columns'] ?? []) ? new mysqli_result($r) : true; }
  public function prepare($query) { return new mysqli_stmt($this, $query); }
  public function real_escape_string($s) { return str_replace("'", "''", (string) $s); }
  public function escape_string($s) { return $this->real_escape_string($s); }
  public function set_charset($c) { return true; }
  public function select_db($d) { return true; }
  public function close() { return true; }
  public function begin_transaction() { return (bool) $this->__run('BEGIN', []); }
  public function commit() { return (bool) $this->__run('COMMIT', []); }
  public function rollback() { return (bool) $this->__run('ROLLBACK', []); }
  public function __run($sql, $params, $stmt = null) {
    $r = __pg_sql($sql, $params);
    if (isset($r['error'])) {
      $this->error = $r['error']; $this->errno = $r['errno'];
      if ($stmt) { $stmt->error = $r['error']; $stmt->errno = $r['errno']; }
      if (__pg_mysqli_report() & MYSQLI_REPORT_STRICT) throw new mysqli_sql_exception($r['error'], $r['errno']);
      if (__pg_mysqli_report() & MYSQLI_REPORT_ERROR) trigger_error($r['error'], E_USER_WARNING);
      return false;
    }
    $this->error = ''; $this->errno = 0; $this->affected_rows = $r['affected'] ?? 0;
    if (isset($r['insertId'])) $this->insert_id = $r['insertId'];
    return $r;
  }
}
function mysqli_connect($h = null, $u = null, $p = null, $d = null, $port = null, $s = null) { return new mysqli($h, $u, $p, $d, $port, $s); }
function mysqli_connect_error() { return null; }
function mysqli_connect_errno() { return 0; }
function mysqli_report($flags) { __pg_mysqli_report($flags); return true; }
function mysqli_set_charset($c, $cs) { return true; }
function mysqli_select_db($c, $d) { return true; }
function mysqli_query($c, $q, $m = 0) { return $c->query($q); }
function mysqli_prepare($c, $q) { return $c->prepare($q); }
function mysqli_stmt_bind_param($stmt, $types, &...$vars) { return $stmt->bind_param($types, ...$vars); }
function mysqli_stmt_execute($stmt, $params = null) { return $stmt->execute($params); }
function mysqli_stmt_get_result($stmt) { return $stmt->get_result(); }
function mysqli_stmt_affected_rows($stmt) { return $stmt->affected_rows; }
function mysqli_stmt_insert_id($stmt) { return $stmt->insert_id; }
function mysqli_stmt_num_rows($stmt) { return $stmt->num_rows; }
function mysqli_stmt_store_result($stmt) { return true; }
function mysqli_stmt_error($stmt) { return $stmt->error; }
function mysqli_stmt_close($stmt) { return true; }
function mysqli_fetch_assoc($r) { return $r->fetch_assoc(); }
function mysqli_fetch_array($r, $mode = MYSQLI_BOTH) { return $r->fetch_array($mode); }
function mysqli_fetch_row($r) { return $r->fetch_row(); }
function mysqli_fetch_object($r) { return $r->fetch_object(); }
function mysqli_fetch_all($r, $mode = MYSQLI_NUM) { return $r->fetch_all($mode); }
function mysqli_num_rows($r) { return $r->num_rows; }
function mysqli_free_result($r) {}
function mysqli_affected_rows($c) { return $c->affected_rows; }
function mysqli_insert_id($c) { return $c->insert_id; }
function mysqli_error($c) { return $c->error; }
function mysqli_errno($c) { return $c->errno; }
function mysqli_real_escape_string($c, $s) { return $c->real_escape_string($s); }
function mysqli_begin_transaction($c) { return $c->begin_transaction(); }
function mysqli_commit($c) { return $c->commit(); }
function mysqli_rollback($c) { return $c->rollback(); }
function mysqli_close($c) { return true; }
}
`

// The PHP that wraps one simulated request.
function wrapper(dir: string, sid: string, sources: Record<string, string>, req: Request, cookies: Record<string, string>) {
  let w = `<?php
${PHP_RUNTIME}
define('__PG_ID', ${q(sid)});
@mkdir(${q(dir)}, 0777, true); @mkdir('/tmp/pgsess', 0777, true);
`
  for (const [name, code] of Object.entries(sources)) {
    const target = `${dir}/${name}`
    w += `@mkdir(dirname(${q(target)}), 0777, true); file_put_contents(${q(target)}, ${name.endsWith('.php') ? `__pg_prepare(base64_decode('${b64(code)}'))` : `base64_decode('${b64(code)}')`});\n`
  }
  const script = `/${req.path}`
  w += `chdir(${q(dir)});
ini_set('session.save_path', '/tmp/pgsess'); ini_set('session.use_strict_mode', '0');
$_GET = []; $_POST = []; parse_str(base64_decode('${b64(req.query)}'), $_GET); parse_str(base64_decode('${b64(req.body)}'), $_POST);
$_COOKIE = json_decode(base64_decode('${b64(JSON.stringify(cookies))}'), true); $_REQUEST = array_merge($_GET, $_POST); $_FILES = [];
// Like a browser, send back the session cookie PHP issued earlier; otherwise session_start() makes a new one.
if (!empty($_COOKIE['PHPSESSID'])) session_id($_COOKIE['PHPSESSID']);
$_SERVER['REQUEST_METHOD'] = ${q(req.method)}; $_SERVER['SCRIPT_NAME'] = $_SERVER['PHP_SELF'] = ${q(script)};
$_SERVER['QUERY_STRING'] = base64_decode('${b64(req.query)}'); $_SERVER['REQUEST_URI'] = ${q(script)} . ($_SERVER['QUERY_STRING'] !== '' ? '?' . $_SERVER['QUERY_STRING'] : '');
$_SERVER['HTTP_HOST'] = $_SERVER['SERVER_NAME'] = 'localhost'; $_SERVER['SERVER_PORT'] = '80'; $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['DOCUMENT_ROOT'] = ${q(dir)}; $_SERVER['SCRIPT_FILENAME'] = ${q(`${dir}${script}`)};
$_SERVER['CONTENT_TYPE'] = ${q(req.contentType ?? (req.body ? 'application/x-www-form-urlencoded' : ''))};
// php://input can't be redirected, so the tokenizer rewrites 'php://input' in the scripts to this file.
file_put_contents('/tmp/pgbody', base64_decode('${b64(req.rawBody ?? req.body)}'));
$_SERVER['CONTENT_LENGTH'] = (string) filesize('/tmp/pgbody');
ob_start();
try { include ${q(`${dir}${script}`)}; }
catch (\\__PgExit $__e) { echo $__e->out; }
catch (\\ParseError $__e) { http_response_code(500); echo "\\nParse error: ", $__e->getMessage(), " in ", $__e->getFile(), " on line ", $__e->getLine(), "\\n"; }
catch (\\Throwable $__e) { http_response_code(500); echo "\\nFatal error: Uncaught ", get_class($__e), ": ", $__e->getMessage(), " in ", $__e->getFile(), ":", $__e->getLine(), "\\n"; }
// End of script, as PHP does it: destroy the script's global variables in reverse order (running any
// __destruct() methods while output is still captured), then save the session.
foreach (array_reverse(array_keys(get_defined_vars())) as $__k) { if ($__k !== 'GLOBALS' && $__k[0] !== '_' && $__k !== 'argv' && $__k !== 'argc') { try { unset($$__k); } catch (\\Throwable $__e) { echo "\\nFatal error: Uncaught ", get_class($__e), ": ", $__e->getMessage(), "\\n"; } } }
if (session_status() === PHP_SESSION_ACTIVE) session_write_close();
$__body = ob_get_clean();
$__files = [];
$__it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(${q(dir)}, FilesystemIterator::SKIP_DOTS));
foreach ($__it as $__f) { $__rel = substr($__f->getPathname(), ${dir.length + 1}); $__row = ['n' => $__rel, 's' => $__f->getSize()];
  if ($__f->getSize() <= 4000 && !in_array($__rel, ${JSON.stringify(Object.keys(sources))}, true)) $__row['t'] = file_get_contents($__f->getPathname());
  $__files[] = $__row; }
echo "\\x1e", json_encode(['h' => headers_list(), 'code' => http_response_code(), 'files' => $__files], JSON_INVALID_UTF8_SUBSTITUTE), "\\x1e", $__body;
`
  return w
}

function resetScript(dir: string, sessionIds: string[]) {
  return `<?php
if (is_dir(${q(dir)})) { $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(${q(dir)}, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
  foreach ($it as $f) { $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname()); } }
foreach (${JSON.stringify(sessionIds)} as $id) { @unlink('/tmp/pgsess/sess_' . preg_replace('/[^A-Za-z0-9,-]/', '', $id)); }`
}

// Injected into the rendered page: forms and relative links become new requests to the simulated server,
// and fetch()/XMLHttpRequest calls (AJAX) are answered by it without leaving the page.
function bridge(channel: string) {
  return `<script>(function(){var ch=${q(channel)};
function send(m){m.pg=ch;parent.postMessage(m,'*')}
document.addEventListener('submit',function(e){var f=e.target;if(!f||f.tagName!=='FORM')return;e.preventDefault();
var fd;try{fd=new FormData(f,e.submitter)}catch(x){fd=new FormData(f);if(e.submitter&&e.submitter.name)fd.append(e.submitter.name,e.submitter.value||'')}
var p=new URLSearchParams();fd.forEach(function(v,k){p.append(k,typeof v==='string'?v:(v&&v.name)||'')});
send({kind:'form',method:(f.getAttribute('method')||'get').toUpperCase(),action:f.getAttribute('action')||'',body:p.toString()})},true);
document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var h=a.getAttribute('href');
if(!h||h.charAt(0)==='#'||/^(https?:|mailto:|tel:|javascript:)/i.test(h))return;e.preventDefault();send({kind:'link',href:h})},true);
var pending={},seq=0;
window.addEventListener('message',function(e){var d=e.data;if(!d||d.pgReply!==ch||!pending[d.id])return;var cb=pending[d.id];delete pending[d.id];cb(d)});
function ask(m){return new Promise(function(res){var id=++seq;pending[id]=res;m.kind='fetch';m.id=id;send(m)})}
function enc(b){if(b==null)return{body:'',type:''};if(typeof b==='string')return{body:b,type:'text/plain;charset=UTF-8'};
if(b instanceof URLSearchParams)return{body:b.toString(),type:'application/x-www-form-urlencoded'};
if(typeof FormData!=='undefined'&&b instanceof FormData){var p=new URLSearchParams();b.forEach(function(v,k){p.append(k,typeof v==='string'?v:(v&&v.name)||'')});return{body:p.toString(),type:'application/x-www-form-urlencoded'}}
return{body:String(b),type:'text/plain;charset=UTF-8'}}
function ctype(h){var ct='';if(!h)return ct;if(typeof Headers!=='undefined'&&h instanceof Headers)return h.get('Content-Type')||'';
if(Array.isArray(h)){h.forEach(function(x){if(String(x[0]).toLowerCase()==='content-type')ct=x[1]});return ct}
for(var k in h)if(k.toLowerCase()==='content-type')ct=h[k];return ct}
window.fetch=function(input,init){init=init||{};var url=typeof input==='string'?input:(input&&input.url)||String(input);var b=enc(init.body);
return ask({url:url,method:(init.method||'GET').toUpperCase(),body:b.body,contentType:ctype(init.headers)||b.type}).then(function(r){
if(r.error)throw new TypeError('Failed to fetch');var nb=r.status===204||r.status===205||r.status===304;return new Response(nb?null:r.body,{status:r.status,headers:r.headers})})};
function XHR(){this.readyState=0;this.status=0;this.statusText='';this.responseText='';this.response='';this.responseType='';this._h={};this._l={};this.onreadystatechange=null;this.onload=null;this.onerror=null;this.onloadend=null}
XHR.prototype.open=function(m,u){this._m=String(m).toUpperCase();this._u=String(u);this.readyState=1;this._ev('readystatechange')};
XHR.prototype.setRequestHeader=function(k,v){this._h[String(k).toLowerCase()]=v};
XHR.prototype.getResponseHeader=function(k){return(this._rh||{})[String(k).toLowerCase()]||null};
XHR.prototype.getAllResponseHeaders=function(){var s='',rh=this._rh||{};for(var k in rh)s+=k+': '+rh[k]+'\\r\\n';return s};
XHR.prototype.addEventListener=function(t,f){(this._l[t]=this._l[t]||[]).push(f)};
XHR.prototype.removeEventListener=function(t,f){this._l[t]=(this._l[t]||[]).filter(function(g){return g!==f})};
XHR.prototype.abort=function(){};
XHR.prototype._ev=function(t){var e={type:t,target:this,currentTarget:this};var f=this['on'+t];if(f)f.call(this,e);(this._l[t]||[]).forEach(function(g){g.call(this,e)},this)};
XHR.prototype.send=function(body){var self=this;var b=enc(body);ask({url:self._u,method:self._m||'GET',body:b.body,contentType:self._h['content-type']||b.type}).then(function(r){
if(r.error){self.readyState=4;self._ev('readystatechange');self._ev('error');self._ev('loadend');return}
self.status=r.status;self._rh=r.headers||{};self.responseText=r.body;
if(self.responseType==='json'){try{self.response=JSON.parse(r.body)}catch(x){self.response=null}}else self.response=r.body;
self.readyState=4;self._ev('readystatechange');self._ev('load');self._ev('loadend')})};
XHR.UNSENT=0;XHR.OPENED=1;XHR.HEADERS_RECEIVED=2;XHR.LOADING=3;XHR.DONE=4;window.XMLHttpRequest=XHR;
})();</script>`
}

function collect(node: React.ReactNode, out: { name: string; code: string }[], sql: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out, sql))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-sql' && typeof props.children === 'string') {
    sql.push(props.children.replace(/\n$/, ''))
    return
  }
  if (typeof props.className === 'string' && /^language-(php|html|css|js|javascript|text|txt)$/.test(props.className) && typeof props.children === 'string') {
    const code = props.children.replace(/\n$/, '')
    // A first-line comment such as "<?php // file: process.php" or "<!-- file: form.html -->" names the file.
    const named = /^\s*(?:<\?php)?\s*(?:\/\/|#|<!--|\/\*)\s*file:\s*([\w./-]+)/.exec(code)
    const lang = props.className.replace('language-', '')
    const fallback = out.length === 0 ? (lang === 'html' ? 'index.html' : 'index.php') : `file${out.length + 1}.${lang === 'javascript' ? 'js' : lang}`
    out.push({ name: named?.[1] ?? fallback, code })
    return
  }
  collect(props.children, out, sql)
}

const REASON: Record<number, string> = { 200: 'OK', 201: 'Created', 204: 'No Content', 422: 'Unprocessable Content', 301: 'Moved Permanently', 302: 'Found', 303: 'See Other', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 500: 'Internal Server Error' }

interface Response {
  method: string
  url: string
  status: number
  headers: string[]
  body: string
}

function splitUrl(raw: string) {
  const [pathPart, ...rest] = raw.split('?')
  return { path: pathPart, query: rest.join('?') }
}

function resolvePath(target: string, current: string) {
  let t = target.trim()
  if (t.startsWith('http://localhost')) t = t.slice('http://localhost'.length)
  const { path, query } = splitUrl(t)
  let p = path
  if (p === '') p = current
  else if (!p.startsWith('/')) {
    const base = current.includes('/') ? current.slice(0, current.lastIndexOf('/') + 1) : ''
    p = base + p
  }
  const parts: string[] = []
  for (const seg of p.replace(/^\/+/, '').split('/')) {
    if (seg === '..') parts.pop()
    else if (seg !== '.' && seg !== '') parts.push(seg)
  }
  return { path: parts.join('/'), query }
}

export default function PhpPlayground({ title, height, children }: { title?: string; height?: string; children: React.ReactNode }) {
  const { initial, dbSetup } = useMemo(() => {
    const out: { name: string; code: string }[] = []
    const sql: string[] = []
    collect(children, out, sql)
    return { initial: out, dbSetup: sql.join('\n') }
  }, [children])
  const entry = initial[0]?.name ?? 'index.php'
  const rawId = useId()
  const sid = useMemo(() => 'pg' + rawId.replace(/[^a-zA-Z0-9]/g, ''), [rawId])
  const dir = `/www/${sid}`
  const frameH = parseInt(height ?? '', 10) || 240

  const [files, setFiles] = useState(() => Object.fromEntries(initial.map(f => [f.name, f.code])) as Record<string, string>)
  const [tab, setTab] = useState(entry)
  const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'ready' | 'failed'>('idle')
  const [res, setRes] = useState<Response | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [view, setView] = useState<'browser' | 'source'>('browser')
  const [address, setAddress] = useState(entry)
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([])
  const [openFile, setOpenFile] = useState<string | null>(null)
  const [dbView, setDbView] = useState<TableView[]>([])
  const ensureDb = useCallback(async () => {
    installSqlBridge()
    if (!dbSetup || dbs.has(sid)) return
    const SQL = await loadSql()
    if (!dbs.has(sid)) dbs.set(sid, freshDb(SQL, dbSetup))
  }, [dbSetup, sid])
  const refreshDbView = useCallback(() => {
    const db = dbs.get(sid)
    if (db) setDbView(snapshot(db))
  }, [sid])
  useEffect(
    () => () => {
      dbs.get(sid)?.close()
      dbs.delete(sid)
    },
    [sid]
  )
  // Error messages mention the virtual folder; show them the way XAMPP would.
  const tidy = useCallback(
    (text: string) =>
      text
        .replace(/PHP Request Startup: /g, '')
        .split(dir + '/')
        .join('C:\\xampp\\htdocs\\'),
    [dir]
  )
  const cookies = useRef<Record<string, string>>({})
  const sessionIds = useRef(new Set<string>())
  const [cookieView, setCookieView] = useState('')
  const filesRef = useRef(files)
  filesRef.current = files

  const applyCookies = (headers: string[]) => {
    for (const h of headers) {
      const m = /^set-cookie:\s*([^=;\s]+)=([^;]*)(.*)$/i.exec(h)
      if (!m) continue
      const [, name, value, attrs] = m
      const exp = /expires=([^;]+)/i.exec(attrs)?.[1]
      const maxAge = /max-age=(-?\d+)/i.exec(attrs)?.[1]
      const expired = (maxAge !== undefined && Number(maxAge) <= 0) || (exp && new Date(exp).getTime() < Date.now()) || value === 'deleted'
      if (expired) delete cookies.current[name]
      else cookies.current[name] = decodeURIComponent(value)
      if (name === 'PHPSESSID' && !expired) sessionIds.current.add(decodeURIComponent(value))
    }
    setCookieView(Object.entries(cookies.current).map(([k, v]) => `${k}=${v.length > 18 ? v.slice(0, 18) + '…' : v}`).join('; '))
  }

  const serverFilesRef = useRef<ServerFile[]>([])

  // One HTTP request to the simulated server (redirects are handled by the callers).
  const serveOnce = useCallback(
    async (php: PhpEngine, req: Request): Promise<Response> => {
      const url = '/' + req.path + (req.query ? '?' + req.query : '')
      const sources = filesRef.current
      const notFound: Response = {
        method: req.method,
        url,
        status: 404,
        headers: [],
        body: `<h1>Not Found</h1><p>The requested URL ${url} was not found on this server.</p><hr><address>Apache/2.4 (Win64) PHP/8.3 Server at localhost Port 80</address>`,
      }
      if (!(req.path in sources)) {
        // Non-PHP files the script created (e.g. notes.txt, results.csv) are served as-is.
        if (/\.php$/i.test(req.path) || req.path === '') return notFound
        const created = serverFilesRef.current.find(f => f.n === req.path)
        return created?.t !== undefined ? { method: req.method, url, status: 200, headers: [], body: created.t } : notFound
      }
      if (!/\.php$/i.test(req.path)) return { method: req.method, url, status: 200, headers: [], body: sources[req.path] }
      const text = await exclusive(async () => {
        sink = []
        await php.refresh()
        await php.run(wrapper(dir, sid, sources, req, cookies.current))
        const t = sink.join('')
        sink = null
        return t
      })
      const a = text.indexOf('\x1e')
      const b = a >= 0 ? text.indexOf('\x1e', a + 1) : -1
      let meta: Meta = { h: [], code: 500, files: [] }
      let body = text
      if (a >= 0 && b > a) {
        try {
          meta = JSON.parse(text.slice(a + 1, b))
        } catch {
          /* keep defaults */
        }
        body = text.slice(0, a) + text.slice(b + 1)
      }
      const location = meta.h.find(h => /^location:/i.test(h))
      const code = meta.code === false ? (location ? 302 : 200) : meta.code
      applyCookies(meta.h)
      serverFilesRef.current = meta.files
      setServerFiles(meta.files)
      refreshDbView()
      return { method: req.method, url, status: code, headers: meta.h, body: tidy(body) }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dir, sid, refreshDbView, tidy]
  )

  const redirectOf = (response: Response, from: string): Request | null => {
    const loc = response.headers.find(h => /^location:/i.test(h))
    if (!loc || response.status < 300 || response.status >= 400) return null
    const next = resolvePath(loc.replace(/^location:\s*/i, ''), from)
    return { method: 'GET', path: next.path || entry, query: next.query, body: '' }
  }

  // A page load: follows redirects and shows the final page in the browser view.
  const request = useCallback(
    async (first: Request) => {
      setStatus(s => (s === 'idle' ? 'loading' : 'running'))
      let php: PhpEngine
      try {
        ;[php] = await Promise.all([loadEngine(), ensureDb()])
      } catch {
        setStatus('failed')
        return
      }
      setStatus('running')
      let req = first
      const hops: string[] = []
      for (let hop = 0; hop < 6; hop++) {
        const response = await serveOnce(php, req)
        hops.push(`${response.method} ${response.url} → ${response.status} ${REASON[response.status] ?? ''}`.trim())
        setRes(response)
        setAddress(response.url.slice(1))
        const next = redirectOf(response, req.path)
        if (!next) break
        req = next
      }
      setLog(prev => [...prev, ...hops].slice(-8))
      setStatus('ready')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serveOnce, ensureDb, entry]
  )

  // An AJAX call from the page's JavaScript: answered in the background; the page stays as it is.
  const ajax = useCallback(
    async (first: Request): Promise<Response> => {
      const [php] = await Promise.all([loadEngine(), ensureDb()])
      let req = first
      let response = await serveOnce(php, req)
      for (let hop = 0; hop < 5; hop++) {
        const next = redirectOf(response, req.path)
        if (!next) break
        req = next
        response = await serveOnce(php, req)
      }
      const shown = `AJAX ${first.method} /${first.path}${first.query ? '?' + first.query : ''} → ${response.status} ${REASON[response.status] ?? ''}`
      setLog(prev => [...prev, shown.trim()].slice(-8))
      return response
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serveOnce, ensureDb, entry]
  )

  // Messages from the rendered page: form submissions, link clicks and AJAX calls.
  const current = useRef({ path: entry })
  current.current.path = res ? splitUrl(res.url.slice(1)).path : entry
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { pg?: string; kind?: string; method?: string; action?: string; body?: string; href?: string; url?: string; id?: number; contentType?: string }
      if (!d || d.pg !== sid) return
      const form = 'application/x-www-form-urlencoded'
      if (d.kind === 'form') {
        const t = resolvePath(d.action ?? '', current.current.path)
        const method = d.method === 'POST' ? 'POST' : 'GET'
        request(
          method === 'POST'
            ? { method, path: t.path || entry, query: t.query, body: d.body ?? '', contentType: form }
            : { method, path: t.path || entry, query: d.body ?? '', body: '' }
        )
      } else if (d.kind === 'link' && d.href) {
        const t = resolvePath(d.href, current.current.path)
        request({ method: 'GET', path: t.path || entry, query: t.query, body: '' })
      } else if (d.kind === 'fetch') {
        const t = resolvePath(d.url ?? '', current.current.path)
        const method = (d.method || 'GET').toUpperCase()
        const hasBody = method !== 'GET' && method !== 'HEAD'
        const contentType = hasBody ? d.contentType ?? '' : ''
        const reply = (msg: object) => (e.source as Window | null)?.postMessage({ pgReply: sid, id: d.id, ...msg }, '*')
        ajax({
          method,
          path: t.path || entry,
          query: t.query,
          body: hasBody && contentType.toLowerCase().startsWith(form) ? d.body ?? '' : '',
          rawBody: hasBody ? d.body ?? '' : '',
          contentType,
        })
          .then(r => {
            const headers: Record<string, string> = {}
            for (const h of r.headers) {
              const i = h.indexOf(':')
              if (i > 0) headers[h.slice(0, i).trim().toLowerCase()] = h.slice(i + 1).trim()
            }
            if (!headers['content-type']) headers['content-type'] = 'text/html; charset=UTF-8'
            reply({ status: r.status, body: r.body, headers })
          })
          .catch(() => reply({ error: true }))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [sid, entry, request, ajax])

  const run = () => request({ method: 'GET', path: entry, query: '', body: '' })
  const go = () => {
    const t = resolvePath(address, entry)
    request({ method: 'GET', path: t.path || entry, query: t.query, body: '' })
  }
  const reset = async () => {
    setFiles(Object.fromEntries(initial.map(f => [f.name, f.code])))
    setTab(entry)
    setRes(null)
    setLog([])
    setAddress(entry)
    setServerFiles([])
    serverFilesRef.current = []
    setOpenFile(null)
    cookies.current = {}
    setCookieView('')
    if (dbs.has(sid)) {
      dbs.get(sid)?.close()
      dbs.delete(sid)
      await ensureDb()
      refreshDbView()
    }
    if (enginePromise) {
      const php = await enginePromise
      await exclusive(async () => {
        await php.refresh()
        await php.run(resetScript(dir, [...sessionIds.current]))
        sessionIds.current.clear()
      })
    }
  }

  const doc = useMemo(() => {
    if (!res) return ''
    const b = bridge(sid)
    return /<head[^>]*>/i.test(res.body) ? res.body.replace(/<head[^>]*>/i, m => m + b) : b + res.body
  }, [res, sid])

  const busy = status === 'loading' || status === 'running'
  const names = Object.keys(files)
  const extra = serverFiles.filter(f => !(f.n in files))
  const statusColor = !res ? '' : res.status >= 500 ? 'text-red-600 dark:text-red-300' : res.status >= 400 ? 'text-amber-600 dark:text-amber-300' : res.status >= 300 ? 'text-sky-700 dark:text-sky-300' : 'text-green-700 dark:text-green-300'

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🐘 {title ?? 'PHP playground'}</p>
        <p className="text-[10.5px] text-brand-navy/45 dark:text-white/40 text-right">Real PHP 8.3 in your browser</p>
      </div>

      <div className="flex gap-1 px-3 pt-2 overflow-x-auto">
        {names.map(n => (
          <button
            key={n}
            onClick={() => setTab(n)}
            className={`px-3 py-1.5 rounded-t-lg text-[12px] font-semibold font-mono whitespace-nowrap ${tab === n ? 'bg-[#021037] text-white' : 'text-brand-navy/55 dark:text-white/50'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        value={files[tab] ?? ''}
        onChange={e => setFiles(prev => ({ ...prev, [tab]: e.target.value }))}
        onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            run()
          }
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label={`Edit ${tab}`}
        rows={Math.min(16, Math.max(5, (files[tab] ?? '').split('\n').length + 1))}
        className="block w-full resize-y bg-[#021037] text-[#e2e8f0] font-mono text-[12.5px] leading-relaxed px-4 py-3 outline-none"
      />

      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-brand-navy/10 dark:border-brand-cyan/10">
        <button onClick={run} disabled={busy} className="px-4 py-1.5 rounded-lg bg-brand-gradient text-white text-[12px] font-bold disabled:opacity-60">
          {status === 'loading' ? 'Starting PHP…' : status === 'running' ? 'Running…' : 'Run ▶'}
        </button>
        <button onClick={reset} disabled={busy} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-brand-deep dark:text-brand-sky disabled:opacity-60">
          Reset
        </button>
        {status === 'idle' && <p className="text-[10.5px] text-brand-navy/45 dark:text-white/40">First run downloads the PHP engine (about 3.5 MB)</p>}
        {status === 'failed' && <p className="text-[11px] text-red-600 dark:text-red-300">The PHP engine could not start in this browser.</p>}
      </div>

      <div className="p-3 bg-brand-soft dark:bg-brand-bg/60">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex-1 flex items-center rounded-lg bg-white dark:bg-brand-surface border border-brand-navy/10 dark:border-white/10 px-2">
            <span className="text-[11px] text-brand-navy/40 dark:text-white/35 font-mono">localhost/</span>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !busy && go()}
              aria-label="Address"
              className="flex-1 min-w-0 bg-transparent py-1.5 text-[11.5px] font-mono outline-none"
            />
          </div>
          <button onClick={go} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-white/10 border border-brand-navy/10 dark:border-white/10 disabled:opacity-60">
            Go
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex gap-1">
            {(['browser', 'source'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2 py-1 rounded-md text-[10.5px] font-semibold ${view === v ? 'bg-brand-gradient text-white' : 'text-brand-navy/60 dark:text-white/55 bg-white/60 dark:bg-white/5'}`}
              >
                {v === 'browser' ? 'Browser view' : 'HTML sent'}
              </button>
            ))}
          </div>
          {res && <p className={`text-[11px] font-mono font-semibold ${statusColor}`}>{res.status} {REASON[res.status] ?? ''}</p>}
        </div>

        {!res ? (
          <div className="rounded-lg border border-dashed border-brand-navy/15 dark:border-white/15 bg-white/60 dark:bg-white/5 flex items-center justify-center text-[12px] text-brand-navy/45 dark:text-white/40 px-4 text-center" style={{ height: Math.min(frameH, 140) }}>
            {busy ? 'Starting the PHP engine…' : 'Press Run to send a request to the PHP server'}
          </div>
        ) : view === 'browser' ? (
          <iframe title={title ?? 'PHP output'} srcDoc={doc} sandbox="allow-scripts allow-modals allow-forms" className="w-full rounded-lg bg-white border border-brand-navy/10" style={{ height: frameH }} />
        ) : (
          <pre className="rounded-lg bg-[#021037] text-[#e2e8f0] text-[11.5px] leading-relaxed font-mono p-3 overflow-auto whitespace-pre-wrap break-words" style={{ maxHeight: frameH + 80 }}>
            {res.body === '' ? '(empty response)' : res.body}
          </pre>
        )}

        {(log.length > 0 || cookieView || extra.length > 0) && (
          <div className="mt-2 space-y-1.5 text-[10.5px] font-mono text-brand-navy/60 dark:text-white/55">
            {log.length > 0 && (
              <div>
                {log.slice(-4).map((l, i) => (
                  <p key={i} className="truncate">
                    {l}
                  </p>
                ))}
              </div>
            )}
            {cookieView && <p className="truncate">🍪 {cookieView}</p>}
            {extra.length > 0 && (
              <div>
                <p className="font-sans font-semibold text-[10px] uppercase text-brand-navy/45 dark:text-white/40">Files the script created on the server</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {extra.map(f => (
                    <button key={f.n} onClick={() => setOpenFile(openFile === f.n ? null : f.n)} className="px-2 py-0.5 rounded bg-white dark:bg-white/10 border border-brand-navy/10 dark:border-white/10">
                      📄 {f.n} ({f.s} B)
                    </button>
                  ))}
                </div>
                {openFile && (
                  <pre className="mt-1.5 rounded bg-white dark:bg-brand-surface border border-brand-navy/10 dark:border-white/10 p-2 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                    {extra.find(f => f.n === openFile)?.t ?? '(binary or large file)'}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {dbSetup && (
          <details className="mt-2 rounded-lg bg-white dark:bg-brand-surface border border-brand-navy/10 dark:border-white/10">
            <summary className="cursor-pointer px-3 py-2 text-[11.5px] font-semibold">
              🗄 MySQL database{dbView.length ? ` — ${dbView.map(t => `${t.name} (${t.count} row${t.count === 1 ? '' : 's'})`).join(', ')}` : ' (loads on first Run)'}
            </summary>
            <div className="px-3 pb-3 space-y-2.5">
              {dbView.map(t => (
                <div key={t.name}>
                  <p className="text-[10.5px] font-mono font-semibold text-brand-navy/60 dark:text-white/55 mb-1">{t.name}</p>
                  <div className="overflow-x-auto rounded border border-brand-navy/10 dark:border-white/10">
                    <table className="min-w-full text-[10.5px]">
                      <thead>
                        <tr>
                          {t.columns.map(c => (
                            <th key={c} className="px-2 py-1 text-left font-semibold bg-brand-mist dark:bg-brand-slate whitespace-nowrap">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {t.rows.map((row, i) => (
                          <tr key={i} className="border-t border-brand-navy/5 dark:border-white/5">
                            {row.map((v, j) => (
                              <td key={j} className="px-2 py-1 whitespace-nowrap font-mono">
                                {v === null ? <span className="italic opacity-50">NULL</span> : String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {t.count === 0 && <p className="px-2 py-1 text-[10px] opacity-60">Empty table</p>}
                  </div>
                </div>
              ))}
              <details>
                <summary className="cursor-pointer text-[10.5px] text-brand-navy/55 dark:text-white/50">SQL that created this database</summary>
                <pre className="mt-1 text-[10.5px] font-mono whitespace-pre-wrap break-words text-brand-navy/70 dark:text-white/65">{dbSetup}</pre>
              </details>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
