# dsp

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Ручное обновление данных в json

В файл `public/data/icons.json` добавлены дубли иконок:
- `fire-ice` — `ice-giant-gas-hydrate`
- `water` — `ocean`
- `sulfuric-acid` — `sulphuric-acid-vein`
- `hydrogen` — `gas-giant-hydrogen`, `ice-giant-hydrogen`
- `deuterium` — `gas-giant-deuterium`
- `gas-giants-exploitation` — `gas-giant`, `ice-giant`

В файле `public/data/data.json заменены скорости для сортеров:
- `sorter-1` — 1.5
- `sorter-2` — 3
- `sorter-3` — 6
- `sorter-4` — 20
