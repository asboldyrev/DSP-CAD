<?php

namespace DspCad\Core;

use JsonMachine\Items;
use JsonMachine\JsonDecoder\ExtJsonDecoder;

/**
 * Генератор JSON файлов для каждого корневого свойства и разделения items по категориям
 */
class JsonGenerator
{
    private string $inputPath;
    private string $outputDir;

    public function __construct(string $inputPath, string $outputDir)
    {
        $this->inputPath = $inputPath;
        $this->outputDir = $outputDir;
    }

    /**
     * Обрабатывает JSON файл и генерирует отдельные JSON файлы для каждого корневого свойства
     */
    public function process(): void
    {
        $decoder = new ExtJsonDecoder(true); // ассоц. массивы вместо stdClass
        $rootIter = Items::fromFile($this->inputPath, ['decoder' => $decoder]);

        // Создаем директорию для выходных файлов
        if (!is_dir($this->outputDir)) {
            mkdir($this->outputDir, 0755, true);
        }

        $rootData = []; // Для сохранения данных JSON

        foreach ($rootIter as $key => $value) {
            // Сохраняем данные для JSON файлов
            $rootData[$key] = $value;
        }

        // Генерируем отдельные JSON файлы для каждого корневого свойства
        $this->emitSeparateJsonFiles($rootData);

        // Дополнительно разделяем items по категориям
        if (isset($rootData['items']) && is_array($rootData['items'])) {
            $this->emitItemsByCategory($rootData['items']);
        }
    }

    /**
     * Генерирует отдельные JSON файлы для каждого корневого свойства
     */
    private function emitSeparateJsonFiles(array $rootData): void
    {
        foreach ($rootData as $key => $data) {
            $this->emitSingleJsonFile($key, $data);
        }
    }

    /**
     * Генерирует отдельный JSON файл для одного свойства
     */
    private function emitSingleJsonFile(string $propertyName, $data): void
    {
        // Создаем имя файла на основе свойства
        $fileName = Utils::ucfirstCamel($propertyName) . '.json';
        $filePath = $this->outputDir . '/' . $fileName;

        // Форматируем JSON с отступами
        $jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        file_put_contents($filePath, $jsonContent);

        echo "Generated JSON file: {$filePath}\n";
    }

    /**
     * Разделяет элементы items по категориям и сохраняет в отдельные файлы
     */
    private function emitItemsByCategory(array $items): void
    {
        // Создаем директорию для файлов категорий
        $itemsDir = $this->outputDir . '/Items';
        if (!is_dir($itemsDir)) {
            mkdir($itemsDir, 0755, true);
        }

        // Группируем элементы по категориям с сохранением последовательности
        $itemsByCategory = [];
        $categoryOrder = []; // Для сохранения порядка появления категорий

        foreach ($items as $item) {
            if (is_array($item) && isset($item['category'])) {
                $category = $item['category'];

                // Добавляем категорию в порядок, если она еще не была
                if (!isset($itemsByCategory[$category])) {
                    $itemsByCategory[$category] = [];
                    $categoryOrder[] = $category;
                }

                // Добавляем элемент в соответствующую категорию
                $itemsByCategory[$category][] = $item;
            }
        }

        // Сохраняем файлы для каждой категории в порядке их появления
        foreach ($categoryOrder as $category) {
            $fileName = $category . '.json';
            $filePath = $itemsDir . '/' . $fileName;

            // Форматируем JSON с отступами
            $jsonContent = json_encode($itemsByCategory[$category], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            file_put_contents($filePath, $jsonContent);

            echo "Generated Items category file: {$filePath} (" . count($itemsByCategory[$category]) . " items)\n";
        }
    }
}
