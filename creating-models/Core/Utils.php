<?php

namespace DspCad\Core;

/**
 * Утилиты для работы с типами, строками и массивами
 */
class Utils
{
    /**
     * Проверяет, является ли массив ассоциативным
     */
    public static function isAssoc(array $a): bool
    {
        return array_keys($a) !== range(0, count($a) - 1);
    }

    /**
     * Преобразует строку в camelCase с заглавной первой буквой
     */
    public static function ucfirstCamel(string $s): string
    {
        $s = preg_replace('/[^a-zA-Z0-9]+/', ' ', $s);
        return str_replace(' ', '', ucwords(trim($s)));
    }

    /**
     * Преобразует множественное число в единственное
     */
    public static function singularize(string $n): string
    {
        if (preg_match('/ies$/i', $n)) return preg_replace('/ies$/i', 'y', $n);
        if (preg_match('/ses$/i', $n)) return preg_replace('/es$/i', '', $n);
        if (preg_match('/s$/i', $n))  return substr($n, 0, -1);
        return $n;
    }

    /**
     * Определяет тип значения
     */
    public static function typeOf($v): string
    {
        if ($v === null) return 'null';
        if (is_bool($v)) return 'boolean';
        if (is_int($v) || is_float($v)) return 'number';
        if (is_string($v)) return 'string';
        if (is_array($v)) return self::isAssoc($v) ? 'object' : 'array';
        return 'unknown';
    }

    /**
     * Создает строковое представление примера значения
     */
    public static function exampleRepr($v): string
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

    /**
     * Экранирует символы для JSON Pointer
     */
    public static function ptrEscape(string $t): string
    {
        return str_replace(['~', '/'], ['~0', '~1'], $t);
    }
}
