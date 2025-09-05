<?php

/**
 * Multi-file TypeScript schema generator for JSON properties.
 * Creates separate TypeScript files for each root property in the JSON.
 * Requires: composer require halaxa/json-machine
 * Usage: php multi_json_parse.php
 */

if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "Run from CLI\n");
    exit(1);
}

require_once __DIR__ . '/vendor/autoload.php';

use DspCad\Core\JsonProcessor;

// Определяем пути к файлам
$inputPath = __DIR__ . '/data/data.json';
$outputDir = __DIR__ . '/data/TypeScript';

// Проверяем существование входного файла
if (!is_file($inputPath)) {
    fwrite(STDERR, "Input file not found: {$inputPath}\n");
    exit(1);
}

try {
    // Создаем процессор и запускаем обработку
    $processor = new JsonProcessor($inputPath, $outputDir);
    $processor->process();

    echo "TypeScript schema files generated successfully in: {$outputDir}\n";
    echo "JSON files generated successfully in: " . dirname($outputDir) . "/Json\n";
} catch (Exception $e) {
    fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
    exit(1);
}
