# Tutor Booking System

Next.js 14 (App Router) + Tailwind + Framer Motion + Lucide. БД — JSON-файл `data/bookings.json` (создаётся и заполняется демо-записями автоматически).

```bash
npm install
npm run dev      # http://localhost:3000
# или: npm run build && npm start
```

- Клиент: `/` — визард записи (услуга → дата/время → данные → подтверждение + .ics)
- Админка: `/admin`, PIN `1234`
- API: `/api/bookings` (GET админ, POST), `/api/bookings/[id]` (PATCH, DELETE), `/api/slots?date=`, `/api/admin/auth`, `/api/admin/stats` (админ-методы требуют заголовок `x-admin-pin`)
- Чтобы сбросить данные — удалите `data/bookings.json`.
