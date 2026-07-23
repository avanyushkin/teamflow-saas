import { PrismaClient } from '../generated/prisma'; // импортируем сгенерированный файл, который содержит ts-типы соответствующие моделям бд
import { PrismaNeon } from '@prisma/adapter-neon';
/*
    Импортирует driver adapter — специальную "прослойку", которая учит PrismaClient разговаривать
    с Neon оптимальным способом (используя Neon's serverless-совместимый драйвер вместо обычного TCP-подключения через pg).
    Зачем это нужно: в serverless-окружениях (Vercel functions, edge runtime) обычные долгоживущие TCP-подключения к
    Postgres плохо работают (каждый вызов функции может быть новым "холодным" окружением).
    Neon-адаптер использует HTTP/WebSocket-транспорт под капотом, что куда лучше подходит под serverless-модель.
*/

const globalForPrisma = globalThis as unknown as {prisma: PrismaClient};
/*
    globalThis - глобальный объект NodeJS (аналог window в браузере), который доступен в любом месте приложения.

    Здесь мы делаем type assertion (as unknown as {...}), чтобы TypeScript не ругался, — мы говорим:
    "считай, что у глобального объекта есть поле prisma такого-то типа", хотя формально globalThis этого не знает.
    Смысл всей конструкции: создать "кэш" клиента прямо в глобальной памяти процесса.
*/

const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
});
/*
    создаем экземпляр neon-адаптера, передавая ему connection string к базе данных из переменных окружения.
    process.env.DATABASE_URL! - берем значение переменной окружения DATABASE_URL, которая должна быть определена в .env.
    Восклицательный знак (!) говорит TypeScript: "я уверен, что эта переменная не undefined".
*/

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
/*
    Логика: "если в глобальном объекте уже лежит закэшированный prisma-клиент — используй его;
    иначе создай новый, передав ему наш adapter".
    
    new PrismaClient({ adapter }) — при создании клиента передаём адаптер вместо стандартного подключения —
    именно это заставляет Prisma использовать Neon-специфичный транспорт вместо обычного TCP.
*/

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
/*
    Зачем нужен весь этот globalThis-паттерн вообще: в dev-режиме Next.js использует hot module reloading (HMR) —
    при каждом изменении файла модули пересоздаются. Без этого кэширования каждое сохранение файла создавало бы новый PrismaClient
    (и новое подключение к базе), быстро исчерпывая лимит одновременных подключений Neon.
    
    В production эта проверка отключена намеренно: там процесс не перезагружается на каждое изменение файла,
    поэтому кэширование в globalThis не нужно (и даже нежелательно, так как каждый serverless-инстанс
    должен создавать свой собственный клиент).
*/