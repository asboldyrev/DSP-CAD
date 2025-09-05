<?php

namespace DspCad\Core;

/**
 * Эмиттер TypeScript кода
 */
class TsEmitter
{
    private array $interfaces = [];
    private array $defs = [];
    private int $counter = 1;

    /**
     * Генерирует корневой TypeScript код
     */
    public function emitRoot(array $node, string $rootName = 'Root'): string
    {
        $rootIface = $this->emitNodeAsNamedInterface($node, $rootName);
        $out = [];
        if (isset($this->defs[$rootIface])) {
            $out[$rootIface] = $this->defs[$rootIface];
            unset($this->defs[$rootIface]);
        }
        foreach ($this->defs as $n => $c) {
            $out[$n] = $c;
        }
        return implode("\n\n", $out) . "\n";
    }

    /**
     * Получает или создает имя для узла схемы
     */
    private function getOrCreateName(array $node, ?string $hint): string
    {
        $sig = SchemaModel::signature($node);
        if (isset($this->interfaces[$sig])) {
            return $this->interfaces[$sig];
        }
        $base = $hint ? Utils::ucfirstCamel($hint) : ("Type" . $this->counter);
        $name = $base;
        while (isset($this->defs[$name])) {
            $this->counter++;
            $name = $base . $this->counter;
        }
        return $this->interfaces[$sig] = $name;
    }

    /**
     * Генерирует именованный интерфейс для узла
     */
    public function emitNodeAsNamedInterface(array $node, string $hint): string
    {
        $name = $this->getOrCreateName($node, $hint);
        if (!isset($this->defs[$name])) {
            $this->defs[$name] = $this->emitInterfaceBody($node, $name);
        }
        return $name;
    }

    /**
     * Генерирует тело интерфейса
     */
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
            $type = $this->emitType($meta['schema'], Utils::ucfirstCamel($key));
            $examples = $meta['examples'] ?? [];
            $comment = empty($examples) ? '' : ' // ' . implode(', ', $examples);
            $lines[] = "  {$prop}{$opt}: {$type};{$comment}";
        }
        return "interface {$name} {\n" . implode("\n", $lines) . "\n}";
    }

    /**
     * Генерирует TypeScript тип
     */
    private function emitType(array $node, ?string $hint = null): string
    {
        switch ($node['kind']) {
            case 'primitive':
                return $node['type'] === 'unknown' ? 'unknown' : ($node['type'] === 'null' ? 'null' : $node['type']);
            case 'array':
                $el = $this->emitType($node['element'], $hint ? Utils::singularize($hint) : null);
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
