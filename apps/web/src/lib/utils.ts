/**
 * Joins CSS class names, filtering out falsy values.
 * Drop-in replacement for clsx/cn without any Tailwind dependency.
 */
export function classNames(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
