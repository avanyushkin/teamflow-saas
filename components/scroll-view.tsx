"use client";

import { forwardRef, useImperativeHandle, useRef, ReactNode } from "react";

export type ScrollViewHandle = {
  scrollToTop: () => void;
  scrollToItem: (id: string) => void;
  getScrollPosition: () => number;
};

type ScrollViewProps = {
  children: ReactNode;
  className?: string;
};

export const ScrollView = forwardRef<ScrollViewHandle, ScrollViewProps>(function ScrollView(
  { children, className },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToTop() { // прокрутить этот div наверх
      containerRef.current?.scrollTo({top: 0, behavior: "smooth"});
    },
      scrollToItem(id: string) { // найти внатри элемент с нужным data-scroll-id и проскроллить к нему
            const el = containerRef.current?.querySelector(`[data-scroll-id="${id}"]`);
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        getScrollPosition() { // узнать, насколько сейчас проскроллено
            return containerRef.current?.scrollTop ?? 0;
        },
  }));
  return (
    <div ref = {containerRef} className = {className}>{children}</div>
  );
})