/*
  Public API модуля auth. Единственный разрешенный способ для внешнего кода получить что-то
  из этого модуля - импорт отсюда, а не напрямую из modules/auth/actions.ts,
  modules/auth/schemas.ts и т.д.

  authConfig/getCurrentSession здесь не реэкспортируются - они живут в @/lib/auth как
  инфраструктурный код ниже модулей (см. комментарий в lib/auth.ts), доступный любому модулю
  напрямую, без обращения к modules/auth.
*/
export { registerUser } from "./actions";
export { formSchemaLogin, formSchemaRegister } from "./schemas";
export { LoginForm } from "./components/login-form";
export { RegisterForm } from "./components/register-form";
