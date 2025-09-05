<?php

namespace DspCad\Core;

/**
 * Модель для работы со схемами данных
 */
class SchemaModel
{
    /**
     * Создает примитивный тип
     */
    public static function mkPrimitive(string $t): array
    {
        return ['kind' => 'primitive', 'type' => $t];
    }

    /**
     * Создает сигнатуру узла схемы
     */
    public static function signature(array $n): string
    {
        $k = $n['kind'];
        if ($k === 'primitive') return "P:" . $n['type'];
        if ($k === 'array')    return "A:" . self::signature($n['element']);
        if ($k === 'object') {
            $keys = array_keys($n['props']);
            sort($keys);
            $p = [];
            foreach ($keys as $key) {
                $opt = !empty($n['props'][$key]['optional']) ? '?' : '';
                $p[] = $key . $opt . ':' . self::signature($n['props'][$key]['schema']);
            }
            return "O:{" . implode(',', $p) . "}";
        }
        if ($k === 'union') {
            $subs = array_map([self::class, 'signature'], $n['types']);
            sort($subs);
            return "U:(" . implode('|', $subs) . ")";
        }
        return 'unknown';
    }

    /**
     * Объединяет типы в union
     */
    public static function unionMerge(array $a, array $b): array
    {
        $types = $a['types'];
        $types[] = $b;
        $seen = [];
        $out = [];
        foreach ($types as $n) {
            $sig = self::signature($n);
            if (!isset($seen[$sig])) {
                $seen[$sig] = true;
                $out[] = $n;
            }
        }
        return ['kind' => 'union', 'types' => $out];
    }

    /**
     * Создает union из двух узлов
     */
    public static function toUnion(array $n1, array $n2): array
    {
        if ($n1['kind'] === 'union') return self::unionMerge($n1, $n2);
        if ($n2['kind'] === 'union') return self::unionMerge($n2, $n1);
        if (self::signature($n1) === self::signature($n2)) return $n1;
        return ['kind' => 'union', 'types' => [$n1, $n2]];
    }

    /**
     * Быстрое определение схемы для значения
     */
    public static function inferQuick($v): array
    {
        $t = Utils::typeOf($v);
        if ($t === 'array')  return ['kind' => 'array', 'element' => self::mkPrimitive('unknown')];
        if ($t === 'object') return ['kind' => 'object', 'props' => []];
        return self::mkPrimitive($t);
    }

    /**
     * Объединяет значение в узел схемы
     */
    public static function mergeValueIntoNode(array &$node, $v, bool $inArrayObjectField = false): void
    {
        $t = Utils::typeOf($v);

        if ($node['kind'] === 'primitive') {
            $n2 = self::inferQuick($v);
            if ($n2['kind'] !== 'primitive' || $n2['type'] !== $node['type']) {
                $node = self::toUnion($node, $n2);
            }
            return;
        }

        if ($node['kind'] === 'union') {
            $merged = false;
            foreach ($node['types'] as &$branch) {
                $sig = self::signature($branch);
                $tmp = $branch;
                self::mergeValueIntoNode($tmp, $v, $inArrayObjectField);
                if (self::signature($tmp) !== $sig) {
                    $branch = $tmp;
                    $merged = true;
                    break;
                }
                if ($t !== 'object' && $t !== 'array' && $sig === self::signature(self::inferQuick($v))) {
                    $merged = true;
                    break;
                }
            }
            unset($branch);
            if (!$merged) {
                $node = self::unionMerge($node, self::inferQuick($v));
            }
            return;
        }

        if ($node['kind'] === 'array') {
            if ($t !== 'array') {
                $node = self::toUnion($node, self::inferQuick($v));
                return;
            }
            foreach ($v as $el) {
                if ($node['element']['kind'] === 'primitive' && $node['element']['type'] === 'unknown') {
                    $node['element'] = self::inferQuick($el);
                }
                self::mergeValueIntoNode($node['element'], $el, false);
            }
            return;
        }

        if ($node['kind'] === 'object') {
            if ($t !== 'object') {
                $node = self::toUnion($node, self::inferQuick($v));
                return;
            }
            foreach ($v as $k => $vv) {
                if (!isset($node['props'][$k])) {
                    $node['props'][$k] = ['schema' => self::inferQuick($vv), 'optional' => false, 'examples' => []];
                }
                self::mergeValueIntoNode($node['props'][$k]['schema'], $vv, $inArrayObjectField);
                if ($inArrayObjectField) {
                    if (count($node['props'][$k]['examples']) < 10) {
                        $node['props'][$k]['examples'][] = Utils::exampleRepr($vv);
                        $node['props'][$k]['examples'] = array_values(array_unique($node['props'][$k]['examples']));
                    } elseif (!in_array('...', $node['props'][$k]['examples'], true)) {
                        $node['props'][$k]['examples'][] = '...';
                    }
                }
            }
            return;
        }
    }
}
