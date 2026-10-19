export {};

declare global {
  type Mock = import('vitest').Mock;
  type MockedFunction<T extends (...args: any[]) => any> = import('vitest').MockedFunction<T>;
  type MockedClass<T extends new (...args: any[]) => any> = import('vitest').MockedClass<T>;
  type SpyInstance<T extends (...args: any[]) => any = (...args: any[]) => any> = import('vitest').MockInstance<T>;
}
