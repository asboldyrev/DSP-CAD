<?php

/**
 * JSON files generator for JSON properties.
 * Creates separate JSON files for each root property in the JSON and splits items by categories.
 * Requires: composer require halaxa/json-machine
 * Usage: php generate_json.php
 */

if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "Run from CLI\n");
    exit(1);
}

require_once __DIR__ . '/vendor/autoload.php';

use DspCad\Core\JsonGenerator;

// Определяем пути к файлам
$inputPath = __DIR__ . '/data/data.json';
$outputDir = __DIR__ . '/data/Json';

// Проверяем существование входного файла
if (!is_file($inputPath)) {
    fwrite(STDERR, "Input file not found: {$inputPath}\n");
    exit(1);
}

try {
    // Создаем генератор JSON и запускаем обработку
    $generator = new JsonGenerator($inputPath, $outputDir);
    $generator->process();

    echo "JSON files generated successfully in: {$outputDir}\n";
} catch (Exception $e) {
    fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
    exit(1);
}
