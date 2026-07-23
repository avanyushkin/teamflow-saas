import "dotenv/config"; // импортирует и сразу исполняет пакет dotenv, который загружает переменные окружения из файла .env в process.env
import { defineConfig, env } from "prisma/config";
/*
    defineConfig - хелпер функция, которая позволяет определить конфигурацию Prisma в TypeScript.
    env - хелпер функция, которая позволяет получить значение переменной окружения из process.env.
*/

export default defineConfig({
    schema: "prisma/schema.prisma", // путь к файлу схемы Prisma, на случай если он не в дефолтном месте
    migrations: { // путь, куда сохранять сгенерировнные SQL-файлы миграций (создается папка с историей всех изменений схемы во времени)
        path: "prisma/migrations",
    },
    datasource: { // говорит CLI-командам (migrate dev, db push, db pull и т.д.) куда подключаться для работы с базой данных
        url: env("DIRECT_URL"), // DIRECT_URL - прямое подключение к NeonDB, без pooler
        // , потому что DDL-операции (создание/удаление таблиц, индексов и т.д.) не поддерживаются через pooler и требуют прямого подключения.
        //  Подробнее: https://neon.tech/docs/concepts/connection-pooling#ddl-operations
    },
});