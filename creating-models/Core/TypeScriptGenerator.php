<?php

namespace DspCad\Core;

use JsonMachine\Items;
use JsonMachine\JsonDecoder\ExtJsonDecoder;

/**
 * Генератор TypeScript файлов для каждого корневого свойства JSON
 */
class TypeScriptGenerator
{
    private string $inputPath;
    private string $outputDir;

    public function __construct(string $inputPath, string $outputDir)
    {
        $this->inputPath = $inputPath;
        $this->outputDir = $outputDir;
    }

    /**
     * Обрабатывает JSON файл и генерирует отдельные TypeScript файлы для каждого корневого свойства
     */
    public function process(): void
    {
        $decoder = new ExtJsonDecoder(true); // ассоц. массивы вместо stdClass
        $rootIter = Items::fromFile($this->inputPath, ['decoder' => $decoder]);

        // Создаем директорию для выходных файлов
        if (!is_dir($this->outputDir)) {
            mkdir($this->outputDir, 0755, true);
        }

        $rootSchema = ['kind' => 'object', 'props' => []];

        foreach ($rootIter as $key => $value) {
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

        // Генерируем отдельные TypeScript файлы для каждого корневого свойства
        $this->emitSeparateFiles($rootSchema);
    }

    /**
     * Обрабатывает массив значений
     */
    private function processArray(array &$rootSchema, $key, $value, ExtJsonDecoder $decoder): void
    {
        // Потоково итерируем элементы массива по ключу $key
        $pointer = '/' . Utils::ptrEscape((string)$key);
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
     * Генерирует отдельные TypeScript файлы для каждого корневого свойства
     */
    private function emitSeparateFiles(array $rootSchema): void
    {
        foreach ($rootSchema['props'] as $key => $meta) {
            $this->emitSingleFile($key, $meta['schema']);
        }
    }

    /**
     * Генерирует отдельный TypeScript файл для одного свойства
     */
    private function emitSingleFile(string $propertyName, array $schema): void
    {
        $emitter = new TsEmitter();

        // Создаем имя файла на основе свойства
        $fileName = Utils::ucfirstCamel($propertyName) . '.ts';
        $filePath = $this->outputDir . '/' . $fileName;

        // Генерируем TypeScript код для этого свойства
        $ts = $emitter->emitRoot($schema, Utils::ucfirstCamel($propertyName));

        // Добавляем заголовок файла
        $content = "/** Auto-generated from JSON: do not edit by hand */\n";
        $content .= "/** Generated from property: {$propertyName} */\n\n";
        $content .= $ts;

        file_put_contents($filePath, $content);

        echo "Generated TypeScript file: {$filePath}\n";
    }
}
