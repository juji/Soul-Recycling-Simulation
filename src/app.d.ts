// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }
}

// Svelte 5 runes declarations
declare global {
  const $state: {
    <T>(initial: T): T;
    <T>(): T | undefined;
  };

  const $derived: {
    <T>(fn: () => T): T;
    by: <T>(fn: () => T) => T;
  };

  const $effect: {
    (fn: () => void | (() => void)): void;
    pre: (fn: () => void | (() => void)) => void;
    root: (fn: () => void | (() => void)) => () => void;
  };

  const $props: <T extends Record<string, any> = any>() => T;
  const $bindable: <T>(initial?: T) => T;
  const $inspect: <T>(...values: T[]) => T extends [any] ? T[0] : T;
  const $host: () => void;
}

export {};
