<?php

/**
 * Memory-friendly TypeScript-like schema inference with inline examples.
 * Requires: composer require halaxa/json-machine
 * Usage: php json_parse.php input.json > schema.d.ts
 */

if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "Run from CLI\n");
    exit(1);
}
$inputPath = $argv[1] ?? null;
if (!$inputPath || !is_file($inputPath)) {
    fwrite(STDERR, "Provide existing JSON file path.\n");
    exit(1);
}

require_once __DIR__ . '/vendor/autoload.php';

use JsonMachine\Items;
use JsonMachine\JsonDecoder\ExtJsonDecoder;

/* ---------------- utils ---------------- */

function is_assoc(array $a): bool
{
    return array_keys($a) !== range(0, count($a) - 1);
}
function ucfirst_camel(string $s): string
{
    $s = preg_replace('/[^a-zA-Z0-9]+/', ' ', $s);
    return str_replace(' ', '', ucwords(trim($s)));
}
function singularize(string $n): string
{
    if (preg_match('/ies$/i', $n)) return preg_replace('/ies$/i', 'y', $n);
    if (preg_match('/ses$/i', $n)) return preg_replace('/es$/i', '', $n);
    if (preg_match('/s$/i', $n))  return substr($n, 0, -1);
    return $n;
}
function type_of($v): string
{
    if ($v === null) return 'null';
    if (is_bool($v)) return 'boolean';
    if (is_int($v) || is_float($v)) return 'number';
    if (is_string($v)) return 'string';
    if (is_array($v)) return is_assoc($v) ? 'object' : 'array';
    return 'unknown';
}
function example_repr($v): string
{
    if (is_string($v)) return $v;
    if (is_int($v) || is_float($v)) return (string)$v;
    if (is_bool($v)) return $v ? 'true' : 'false';
    if ($v === null) return 'null';
    $s = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($s === false) $s = '[unprintable]';
    if (mb_strlen($s) > 80) $s = mb_substr($s, 0, 79) . '…';
    return $s;
}
function ptr_escape(string $t): string
{
    return str_replace(['~', '/'], ['~0', '~1'], $t);
}

/* --------------- schema model --------------- */
function mk_primitive(string $t): array
{
    return ['kind' => 'primitive', 'type' => $t];
}
function signature(array $n): string
{
    $k = $n['kind'];
    if ($k === 'primitive') return "P:" . $n['type'];
    if ($k === 'array')    return "A:" . signature($n['element']);
    if ($k === 'object') {
        $keys = array_keys($n['props']);
        sort($keys);
        $p = [];
        foreach ($keys as $key) {
            $opt = !empty($n['props'][$key]['optional']) ? '?' : '';
            $p[] = $key . $opt . ':' . signature($n['props'][$key]['schema']);
        }
        return "O:{" . implode(',', $p) . "}";
    }
    if ($k === 'union') {
        $subs = array_map('signature', $n['types']);
        sort($subs);
        return "U:(" . implode('|', $subs) . ")";
    }
    return 'unknown';
}
function union_merge(array $a, array $b): array
{
    $types = $a['types'];
    $types[] = $b;
    $seen = [];
    $out = [];
    foreach ($types as $n) {
        $sig = signature($n);
        if (!isset($seen[$sig])) {
            $seen[$sig] = true;
            $out[] = $n;
        }
    }
    return ['kind' => 'union', 'types' => $out];
}
function to_union(array $n1, array $n2): array
{
    if ($n1['kind'] === 'union') return union_merge($n1, $n2);
    if ($n2['kind'] === 'union') return union_merge($n2, $n1);
    if (signature($n1) === signature($n2)) return $n1;
    return ['kind' => 'union', 'types' => [$n1, $n2]];
}
function infer_quick($v): array
{
    $t = type_of($v);
    if ($t === 'array')  return ['kind' => 'array', 'element' => mk_primitive('unknown')];
    if ($t === 'object') return ['kind' => 'object', 'props' => []];
    return mk_primitive($t);
}
/** merge $node <- $v ; collect examples if inside array-of-objects */
function merge_value_into_node(array &$node, $v, bool $inArrayObjectField = false): void
{
    $t = type_of($v);

    if ($node['kind'] === 'primitive') {
        $n2 = infer_quick($v);
        if ($n2['kind'] !== 'primitive' || $n2['type'] !== $node['type']) $node = to_union($node, $n2);
        return;
    }
    if ($node['kind'] === 'union') {
        $merged = false;
        foreach ($node['types'] as &$branch) {
            $sig = signature($branch);
            $tmp = $branch;
            merge_value_into_node($tmp, $v, $inArrayObjectField);
            if (signature($tmp) !== $sig) {
                $branch = $tmp;
                $merged = true;
                break;
            }
            if ($t !== 'object' && $t !== 'array' && $sig === signature(infer_quick($v))) {
                $merged = true;
                break;
            }
        }
        unset($branch);
        if (!$merged) $node = union_merge($node, infer_quick($v));
        return;
    }
    if ($node['kind'] === 'array') {
        if ($t !== 'array') {
            $node = to_union($node, infer_quick($v));
            return;
        }
        foreach ($v as $el) {
            if ($node['element']['kind'] === 'primitive' && $node['element']['type'] === 'unknown') {
                $node['element'] = infer_quick($el);
            }
            merge_value_into_node($node['element'], $el, false);
        }
        return;
    }
    if ($node['kind'] === 'object') {
        if ($t !== 'object') {
            $node = to_union($node, infer_quick($v));
            return;
        }
        foreach ($v as $k => $vv) {
            if (!isset($node['props'][$k])) {
                $node['props'][$k] = ['schema' => infer_quick($vv), 'optional' => false, 'examples' => []];
            }
            merge_value_into_node($node['props'][$k]['schema'], $vv, $inArrayObjectField);
            if ($inArrayObjectField) {
                if (count($node['props'][$k]['examples']) < 10) {
                    $node['props'][$k]['examples'][] = example_repr($vv);
                    $node['props'][$k]['examples'] = array_values(array_unique($node['props'][$k]['examples']));
                } elseif (!in_array('...', $node['props'][$k]['examples'], true)) {
                    $node['props'][$k]['examples'][] = '...';
                }
            }
        }
        return;
    }
}

/* --------------- TS emitter --------------- */
class TsEmitter
{
    private array $interfaces = [];
    private array $defs = [];
    private int $counter = 1;
    public function emitRoot(array $node, string $rootName = 'Root'): string
    {
        $rootIface = $this->emitNodeAsNamedInterface($node, $rootName);
        $out = [];
        if (isset($this->defs[$rootIface])) {
            $out[$rootIface] = $this->defs[$rootIface];
            unset($this->defs[$rootIface]);
        }
        foreach ($this->defs as $n => $c) $out[$n] = $c;
        return implode("\n\n", $out) . "\n";
    }
    private function getOrCreateName(array $node, ?string $hint): string
    {
        $sig = signature($node);
        if (isset($this->interfaces[$sig])) return $this->interfaces[$sig];
        $base = $hint ? ucfirst_camel($hint) : ("Type" . $this->counter);
        $name = $base;
        while (isset($this->defs[$name])) {
            $this->counter++;
            $name = $base . $this->counter;
        }
        return $this->interfaces[$sig] = $name;
    }
    public function emitNodeAsNamedInterface(array $node, string $hint): string
    {
        $name = $this->getOrCreateName($node, $hint);
        if (!isset($this->defs[$name])) $this->defs[$name] = $this->emitInterfaceBody($node, $name);
        return $name;
    }
    private function emitInterfaceBody(array $node, string $name): string
    {
        if ($node['kind'] !== 'object') {
            $type = $this->emitType($node, $name);
            return "type {$name} = {$type};";
        }
        $lines = [];
        foreach ($node['props'] as $key => $meta) {
            $prop = preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $key) ? $key : json_encode($key);
            $opt = !empty($meta['optional']) ? '?' : '';
            $type = $this->emitType($meta['schema'], ucfirst_camel($key));
            $examples = $meta['examples'] ?? [];
            $comment = empty($examples) ? '' : ' // ' . implode(', ', $examples);
            $lines[] = "  {$prop}{$opt}: {$type};{$comment}";
        }
        return "interface {$name} {\n" . implode("\n", $lines) . "\n}";
    }
    private function emitType(array $node, ?string $hint = null): string
    {
        switch ($node['kind']) {
            case 'primitive':
                return $node['type'] === 'unknown' ? 'unknown' : ($node['type'] === 'null' ? 'null' : $node['type']);
            case 'array':
                $el = $this->emitType($node['element'], $hint ? singularize($hint) : null);
                return "Array<{$el}>";
            case 'object':
                $iname = $this->emitNodeAsNamedInterface($node, $hint ?? 'Object');
                return $iname;
            case 'union':
                $parts = array_values(array_unique(array_map(fn($n) => $this->emitType($n, $hint), $node['types'])));
                return implode(' | ', $parts);
        }
        return 'unknown';
    }
}

/* --------------- streaming over ROOT --------------- */
/** Важное изменение:
 *  1) Для корня — НИКАКОГО pointer. Это итерирует верхний уровень (объект/массив).
 *  2) Для больших массивов по ключу K — pointer '/K' (без '/*' и без '/-/').
 *     (Гайд: https://github.com/halaxa/json-machine — см. "Parsing a subtree" и "Parsing nested values in arrays")
 */

$decoder = new ExtJsonDecoder(true); // ассоц. массивы вместо stdClass
$rootIter = Items::fromFile($inputPath, ['decoder' => $decoder]);

$rootSchema = ['kind' => 'object', 'props' => []];

foreach ($rootIter as $key => $value) {
    // Если корень — объект, $key — строка. Если корень — массив, $key — число.
    // Мы всё равно собираем как объект с numeric-ключами — TS это переварит (или при желании можно сделать Array<...>).

    if (!isset($rootSchema['props'][$key])) {
        $rootSchema['props'][$key] = [
            'schema'   => infer_quick($value),
            'optional' => false,
            'examples' => [],
        ];
    }

    $t = type_of($value);

    if ($t === 'array') {
        // Потоково итерируем элементы массива по ключу $key
        $pointer = '/' . ptr_escape((string)$key);       // <<< главное изменение: БЕЗ '/*' и БЕЗ '/-'
        $itemsIter = Items::fromFile($inputPath, ['pointer' => $pointer, 'decoder' => $decoder]);

        $arrNode = $rootSchema['props'][$key]['schema'];
        if ($arrNode['kind'] !== 'array') $arrNode = ['kind' => 'array', 'element' => mk_primitive('unknown')];

        foreach ($itemsIter as $idx => $element) {
            $isObj = is_array($element) && is_assoc($element);

            if ($arrNode['element']['kind'] === 'primitive' && $arrNode['element']['type'] === 'unknown') {
                $arrNode['element'] = infer_quick($element);
            }
            merge_value_into_node($arrNode['element'], $element, $isObj);

            if ($isObj && $arrNode['element']['kind'] === 'object') {
                $seenNow = array_fill_keys(array_keys($element), true);
                foreach ($arrNode['element']['props'] as $pKey => &$pMeta) {
                    if (!isset($seenNow[$pKey])) $pMeta['optional'] = true;
                }
                unset($pMeta);
            }
        }

        $rootSchema['props'][$key]['schema'] = $arrNode;
    } elseif ($t === 'object') {
        merge_value_into_node($rootSchema['props'][$key]['schema'], $value, false);
    } else {
        merge_value_into_node($rootSchema['props'][$key]['schema'], $value, false);
    }
}

/* --------------- emit TS --------------- */
$emitter = new TsEmitter();
$ts = $emitter->emitRoot($rootSchema, 'Root');

echo "/** Auto-generated from JSON: do not edit by hand */\n";
echo $ts;
