# Отпуск-план

Локальное single-page приложение для планирования отпусков сотрудников по отделам.

## Запуск

Откройте `index.html` в браузере. Данные сохраняются в `localStorage` браузера.

Исходный монолитный файл `vacation_product_v22_empty_anti_duplicates (2).html` оставлен как резервная версия.

## Структура

- `index.html` - разметка приложения.
- `css/styles.css` - стили интерфейса и печати.
- `js/app.js` - логика продукта.
- `tests/logic.test.js` - проверки ключевой бизнес-логики.
- `site_logic_code_review_report.txt` - подробный отчет ревью.

## Проверка

```powershell
npm.cmd test
npm.cmd run check
```

Можно запускать проверки и по отдельности:

```powershell
node --check js\app.js
node tests\logic.test.js
node tests\static.test.js
```

Главное правило продукта: основной отпуск `28` дней считается отдельно для каждого календарного года.
