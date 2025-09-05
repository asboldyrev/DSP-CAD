<?php

namespace DspCad;

/**
 * Процессор для анализа producers из recipes.json
 * Разделяет producers на майнеры (без входных ресурсов) и обработчики (с входными ресурсами)
 */
class ProducersProcessor
{
    private string $inputPath;
    private string $outputPath;

    public function __construct(string $inputPath, string $outputPath)
    {
        $this->inputPath = $inputPath;
        $this->outputPath = $outputPath;
    }

    /**
     * Обрабатывает файл recipes.json и создает файл с producers
     */
    public function process(): void
    {
        // Читаем JSON файл
        $recipesData = $this->readJsonFile();

        // Собираем уникальные producers
        $producersData = $this->collectProducers($recipesData);

        // Сохраняем результат
        $this->saveJsonFile($producersData);

        echo "Producers processed successfully: {$this->outputPath}\n";
        echo "Miners: " . count($producersData['miners']) . "\n";
        echo "Processors: " . count($producersData['processors']) . "\n";
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
     * Собирает уникальные producers и разделяет их на категории
     */
    private function collectProducers(array $recipes): array
    {
        $miners = [];      // producers для рецептов без входных ресурсов
        $processors = [];  // producers для рецептов с входными ресурсами

        foreach ($recipes as $recipe) {
            // Проверяем наличие поля producers
            if (!isset($recipe['producers']) || !is_array($recipe['producers'])) {
                continue;
            }

            // Определяем категорию на основе поля 'in'
            $hasInput = isset($recipe['in']) && is_array($recipe['in']) && !empty($recipe['in']);

            foreach ($recipe['producers'] as $producer) {
                if ($hasInput) {
                    // Обработчик - есть входные ресурсы
                    $processors[$producer] = true;
                } else {
                    // Майнер - нет входных ресурсов
                    $miners[$producer] = true;
                }
            }
        }

        return [
            'miners' => array_keys($miners),
            'processors' => array_keys($processors)
        ];
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

    $inputPath = __DIR__ . '/data/recipes.json';
    $outputPath = __DIR__ . '/data/Json/producers.json';

    try {
        $processor = new ProducersProcessor($inputPath, $outputPath);
        $processor->process();
    } catch (\Exception $e) {
        fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
        exit(1);
    }
}
