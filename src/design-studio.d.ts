declare module '*design/runtime/theme-modes.mjs' {
  export type ColorMode = 'system' | 'light' | 'dark';
  export interface ColorModePreference {
    readonly value: ColorMode;
    readonly resolved: 'light' | 'dark';
    set(value: ColorMode): void;
    destroy(): void;
  }
  export function createColorModePreference(options: {
    key: string;
    onChange: (resolved: 'light' | 'dark', value: ColorMode) => void;
  }): ColorModePreference;
}
declare module '*design/runtime/icons.mjs' {
  export interface IconNode {
    tag: string;
    attrs: Record<string, string>;
    children: IconNode[];
  }
  export function iconModel(name: string, options?: { size?: 'small' | 'medium' | 'large' }): IconNode;
}
