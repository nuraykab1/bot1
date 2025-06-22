# TechLab Digital Solutions - Enhanced Telegram Bot

Полнофункциональный Telegram-бот для образовательного центра с интеграцией CRM, базы данных и онлайн-платежей.

## 🚀 Возможности

### 🤖 Telegram Bot
- Многоязычная поддержка (русский, казахский)
- Регистрация на курсы через диалог
- Информация о курсах и FAQ
- Личный кабинет студента
- Уведомления о статусе оплаты

### 💾 База данных (Supabase)
- Полная информация о студентах
- Управление курсами и записями
- История платежей
- Логирование всех активностей
- Row Level Security (RLS)

### 💳 Онлайн-платежи (Stripe)
- Безопасная обработка платежей
- Поддержка казахстанского тенге
- Автоматическое обновление статусов
- Webhook-интеграция
- Мобильно-адаптивная страница оплаты

### 📊 CRM Dashboard
- Статистика по студентам и курсам
- Мониторинг активностей в реальном времени
- Управление записями и платежами
- Аналитика по курсам
- Автообновление данных

## 🛠 Технологический стек

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Bot**: node-telegram-bot-api
- **Frontend**: Vanilla HTML/CSS/JS
- **Deployment**: Ready for production

## 📋 Требования

- Node.js 18+
- Supabase аккаунт
- Stripe аккаунт
- Telegram Bot Token

## ⚙️ Установка и настройка

### 1. Клонирование и установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните следующие переменные:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Server
PORT=3000
NODE_ENV=development
```

### 3. Настройка Supabase

1. Создайте новый проект в [Supabase](https://supabase.com)
2. Выполните миграцию базы данных:
   - Скопируйте содержимое `supabase/migrations/create_initial_schema.sql`
   - Выполните в SQL Editor вашего Supabase проекта

### 4. Настройка Stripe

1. Создайте аккаунт в [Stripe](https://stripe.com)
2. Получите API ключи в Dashboard → Developers → API keys
3. Настройте webhook endpoint: `https://your-domain.com/webhook/stripe`
4. Выберите события: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`

### 5. Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Настройте команды бота:
   ```
   start - Начать работу с ботом
   ```

## 🚀 Запуск

### Режим разработки
```bash
npm run dev
```

### Продакшн
```bash
npm start
```

## 📱 Использование

### Telegram Bot
1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Выберите язык
4. Используйте меню для навигации

### CRM Dashboard
Откройте `http://localhost:3000/crm` для доступа к панели управления

### Страница оплаты
Автоматически генерируется при записи на курс через бота

## 🗂 Структура проекта

```
├── src/
│   ├── bot/                 # Telegram bot логика
│   │   ├── bot.js          # Основной файл бота
│   │   └── texts.js        # Тексты для локализации
│   ├── config/             # Конфигурация
│   │   ├── database.js     # Настройка Supabase
│   │   └── stripe.js       # Настройка Stripe
│   ├── services/           # Бизнес-логика
│   │   ├── studentService.js
│   │   ├── courseService.js
│   │   ├── paymentService.js
│   │   └── crmService.js
│   ├── web/                # Web интерфейсы
│   │   ├── paymentPage.js  # Страница оплаты
│   │   └── crmDashboard.js # CRM панель
│   └── webhooks/           # Webhook обработчики
│       └── stripeWebhook.js
├── supabase/
│   └── migrations/         # SQL миграции
├── server.js              # Главный сервер
├── package.json
└── README.md
```

## 🔧 API Endpoints

- `GET /` - Информация о сервисе
- `GET /health` - Проверка состояния
- `GET /payment` - Страница оплаты
- `GET /crm` - CRM Dashboard
- `POST /webhook/stripe` - Stripe webhooks
- `GET /api/crm/dashboard` - API данных CRM

## 📊 База данных

### Основные таблицы:
- `students` - Информация о студентах
- `courses` - Доступные курсы
- `enrollments` - Записи на курсы
- `payments` - История платежей
- `crm_activities` - Лог активностей

## 🔒 Безопасность

- Row Level Security (RLS) для всех таблиц
- Webhook signature verification
- SSL/TLS шифрование
- Валидация входных данных
- Безопасное хранение токенов

## 🚀 Деплой

### Подготовка к продакшну:
1. Настройте домен и SSL сертификат
2. Обновите webhook URL в Stripe
3. Установите переменные окружения
4. Настройте процесс-менеджер (PM2)

### Пример деплоя с PM2:
```bash
npm install -g pm2
pm2 start server.js --name "techlab-bot"
pm2 startup
pm2 save
```

## 📈 Мониторинг

- Логирование всех операций
- CRM Dashboard с реальными данными
- Автоматическое обновление статистики
- Webhook статусы в реальном времени

## 🤝 Поддержка

Для вопросов и поддержки:
- Email: support@techlab.kz
- Telegram: @TechLabSupport

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.