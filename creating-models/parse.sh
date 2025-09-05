mkdir -p TypeScript
php ./json_parse.php ./data/data.json > ./TypeScript/data.d.ts
php ./json_parse.php ./data/defaults.json > ./TypeScript/defaults.d.ts
php ./json_parse.php ./data/hash.json > ./TypeScript/hash.d.ts
php ./json_parse.php ./data/map.json > ./TypeScript/map.d.ts