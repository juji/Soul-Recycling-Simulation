/// <reference types="svelte" />
/// <reference types="vite/client" />

// Svelte 5 runes type declarations
declare global {
  function $state<T>(initial?: T): T;
  function $derived<T>(fn: () => T): T;
  function $effect(fn: () => void | (() => void)): void;
  function $props<T = Record<string, any>>(): T;
  function $bindable<T>(initial?: T): T;
  function $inspect<T>(value: T): T;
}
