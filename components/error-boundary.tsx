"use client";

import { Component, ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
}

type ErrorBoundaryState = {
  hasError: boolean;
}

/*
  ErrorBoundary ловит ошибки только во время рендера дочерних компонентов (и в из конструкторах/lifecycle-методах) - 
  но не ловит ошибки в обработчиках событий (onClick и тп), в асинхронном коде (setTimeout, fetch) или в самом себе.
  Для событий/асинхронщины нужен обычный try/catch
*/
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  // вызывается React-ом, когда где-то ниже по дереву (в children) выбрасывается ошибка во время рендера.
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // вызывается следом за getDerivedStateFromError(), для побочных эффектов (логирование, отправка в Sentry и тп)
  componentDidCatch(error: unknown, info: unknown) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
        return this.props.fallback;
    }
    return this.props.children;
  }
}