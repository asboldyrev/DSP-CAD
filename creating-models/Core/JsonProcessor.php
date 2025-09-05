<?php

namespace DspCad\Core;

use JsonMachine\Items;
use JsonMachine\JsonDecoder\ExtJsonDecoder;

/**
 * Основной процессор JSON файлов
 */
class JsonProcessor
{
    private string $inputPath;
    private string $outputPath;

    public function __construct(string $inputPath, string $outputPath)
    {
        $this->inputPath = $inputPath;
        $this->outputPath = $outputPath;
    }

    /**
     * Обрабатывает JSON файл и генерирует TypeScript схему
     */
    public function process(): void
    {
        $decoder = new ExtJsonDecoder(true); // ассоц. массивы вместо stdClass
        $rootIter = Items::fromFile($this->inputPath, ['decoder' => $decoder]);

        $rootSchema = ['kind' => 'object', 'props' => []];

        foreach ($rootIter as $key => $value) {
            // Если корень — объект, $key — строка. Если корень — массив, $key — число.
            // Мы всё равно собираем как объект с numeric-ключами — TS это переварит (или при желании можно сделать Array<...>).

            if (!isset($rootSchema['props'][$key])) {
                $rootSchema['props'][$key] = [
                    'schema'   => SchemaModel::inferQuick($value),
                    'optional' => false,
                    'examples' => [],
                ];
            }

            $t = Utils::typeOf($value);

            if ($t === 'array') {
                $this->processArray($rootSchema, $key, $value, $decoder);
            } elseif ($t === 'object') {
                SchemaModel::mergeValueIntoNode($rootSchema['props'][$key]['schema'], $value, false);
            } else {
                SchemaModel::mergeValueIntoNode($rootSchema['props'][$key]['schema'], $value, false);
            }
        }

        $this->emitTypeScript($rootSchema);
    }

    /**
     * Обрабатывает массив значений
     */
    private function processArray(array &$rootSchema, $key, $value, ExtJsonDecoder $decoder): void
    {
        // Потоково итерируем элементы массива по ключу $key
        $pointer = '/' . Utils::ptrEscape((string)$key);       // <<< главное изменение: БЕЗ '/*' и БЕЗ '/-'
        $itemsIter = Items::fromFile($this->inputPath, ['pointer' => $pointer, 'decoder' => $decoder]);

        $arrNode = $rootSchema['props'][$key]['schema'];
        if ($arrNode['kind'] !== 'array') {
            $arrNode = ['kind' => 'array', 'element' => SchemaModel::mkPrimitive('unknown')];
        }

        foreach ($itemsIter as $idx => $element) {
            $isObj = is_array($element) && Utils::isAssoc($element);

            if ($arrNode['element']['kind'] === 'primitive' && $arrNode['element']['type'] === 'unknown') {
                $arrNode['element'] = SchemaModel::inferQuick($element);
            }
            SchemaModel::mergeValueIntoNode($arrNode['element'], $element, $isObj);

            if ($isObj && $arrNode['element']['kind'] === 'object') {
                $seenNow = array_fill_keys(array_keys($element), true);
                foreach ($arrNode['element']['props'] as $pKey => &$pMeta) {
                    if (!isset($seenNow[$pKey])) {
                        $pMeta['optional'] = true;
                    }
                }
                unset($pMeta);
            }
        }

        $rootSchema['props'][$key]['schema'] = $arrNode;
    }

    /**
     * Генерирует и сохраняет TypeScript код
     */
    private function emitTypeScript(array $rootSchema): void
    {
        $emitter = new TsEmitter();
        $ts = $emitter->emitRoot($rootSchema, 'Root');

        // Создаем директорию если не существует
        $outputDir = dirname($this->outputPath);
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $content = "/** Auto-generated from JSON: do not edit by hand */\n";
        $content .= $ts;

        file_put_contents($this->outputPath, $content);
    }
}
