<?php

namespace DspCad;

/**
 * Процессор для извлечения конвейеров и сортеров из data.json
 * Создает JSON файл с двумя списками: конвейеры и сортеры
 */
class BeltsProcessor
{
    private string $inputPath;
    private string $outputPath;

    public function __construct(string $inputPath, string $outputPath)
    {
        $this->inputPath = $inputPath;
        $this->outputPath = $outputPath;
    }

    /**
     * Обрабатывает файл data.json и создает файл с конвейерами и сортерами
     */
    public function process(): void
    {
        // Читаем JSON файл
        $data = $this->readJsonFile();

        // Извлекаем конвейеры и сортеры
        $beltsData = $this->extractBeltsAndSorters($data);

        // Сохраняем результат
        $this->saveJsonFile($beltsData);

        echo "Belts and sorters processed successfully: {$this->outputPath}\n";
        echo "Belts: " . count($beltsData['belts']) . "\n";
        echo "Sorters: " . count($beltsData['sorters']) . "\n";
    }

    /**
     * Читает JSON файл
     */
    private function readJsonFile(): array
    {
        if (!file_exists($this->inputPath)) {
            throw new \Exception("Input file not found: {$this->inputPath}");
        }

        $content = file_get_contents($this->inputPath);
        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("JSON decode error: " . json_last_error_msg());
        }

        return $data;
    }

    /**
     * Извлекает конвейеры и сортеры из данных
     */
    private function extractBeltsAndSorters(array $data): array
    {
        $belts = [];
        $sorters = [];

        // Проверяем наличие массива items
        if (!isset($data['items']) || !is_array($data['items'])) {
            throw new \Exception("Items array not found in data");
        }

        foreach ($data['items'] as $item) {
            if (!isset($item['id']) || !isset($item['category'])) {
                continue;
            }

            $id = $item['id'];
            $category = $item['category'];

            // Проверяем, что это строение
            if ($category !== 'buildings') {
                continue;
            }

            // Проверяем, является ли элемент конвейером
            if ($this->isBelt($item)) {
                $belts[$id] = true;
            }

            // Проверяем, является ли элемент сортером
            if ($this->isSorter($item)) {
                $sorters[$id] = true;
            }
        }

        return [
            'belts' => array_keys($belts),
            'sorters' => array_keys($sorters)
        ];
    }

    /**
     * Проверяет, является ли элемент конвейером
     */
    private function isBelt(array $item): bool
    {
        $id = $item['id'];

        // Проверяем по ID
        if (strpos($id, 'conveyor-belt') === 0) {
            return true;
        }

        // Проверяем наличие поля belt
        if (isset($item['belt']) && is_array($item['belt'])) {
            return true;
        }

        return false;
    }

    /**
     * Проверяет, является ли элемент сортером
     */
    private function isSorter(array $item): bool
    {
        $id = $item['id'];

        // Проверяем по ID
        if (strpos($id, 'sorter') === 0) {
            return true;
        }

        // Проверяем по pile-sorter
        if (strpos($id, 'pile-sorter') === 0) {
            return true;
        }

        // Проверяем по sorter-cargo
        if (strpos($id, 'sorter-cargo') === 0) {
            return true;
        }

        return false;
    }

    /**
     * Сохраняет результат в JSON файл
     */
    private function saveJsonFile(array $data): void
    {
        // Создаем директорию если не существует
        $outputDir = dirname($this->outputPath);
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($jsonContent === false) {
            throw new \Exception("JSON encode error: " . json_last_error_msg());
        }

        file_put_contents($this->outputPath, $jsonContent);
    }
}

// Запуск из командной строки
if (php_sapi_name() === 'cli') {
    require_once __DIR__ . '/vendor/autoload.php';

    $inputPath = __DIR__ . '/data/data.json';
    $outputPath = __DIR__ . '/data/Json/belts.json';

    try {
        $processor = new BeltsProcessor($inputPath, $outputPath);
        $processor->process();
    } catch (\Exception $e) {
        fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
        exit(1);
    }
}
