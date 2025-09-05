<?php

/**
 * TypeScript schema generator for JSON properties.
 * Creates separate TypeScript files for each root property in the JSON.
 * Requires: composer require halaxa/json-machine
 * Usage: php generate_typescript.php
 */

if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "Run from CLI\n");
    exit(1);
}

require_once __DIR__ . '/vendor/autoload.php';

use DspCad\Core\TypeScriptGenerator;

// Определяем пути к файлам
$inputPath = __DIR__ . '/data/data.json';
$outputDir = __DIR__ . '/data/TypeScript';

// Проверяем существование входного файла
if (!is_file($inputPath)) {
    fwrite(STDERR, "Input file not found: {$inputPath}\n");
    exit(1);
}

try {
    // Создаем генератор TypeScript и запускаем обработку
    $generator = new TypeScriptGenerator($inputPath, $outputDir);
    $generator->process();

    echo "TypeScript schema files generated successfully in: {$outputDir}\n";
} catch (Exception $e) {
    fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
    exit(1);
}
