<?php

/**
 * Memory-friendly TypeScript-like schema inference with inline examples.
 * Requires: composer require halaxa/json-machine
 * Usage: php json_parse.php
 */

if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "Run from CLI\n");
    exit(1);
}

require_once __DIR__ . '/vendor/autoload.php';

use DspCad\Core\JsonProcessor;


// Определяем пути к файлам
$inputPath = __DIR__ . '/data.json';
$outputPath = __DIR__ . '/TypeScript/data.d.ts';

// Проверяем существование входного файла
if (!is_file($inputPath)) {
    fwrite(STDERR, "Input file not found: {$inputPath}\n");
    exit(1);
}

try {
    // Создаем процессор и запускаем обработку
    $processor = new JsonProcessor($inputPath, $outputPath);
    $processor->process();

    echo "TypeScript schema generated successfully: {$outputPath}\n";
} catch (Exception $e) {
    fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
    exit(1);
}
