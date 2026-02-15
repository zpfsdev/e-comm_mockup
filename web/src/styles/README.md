# Vanilla CSS foundation

## Structure

- `variables.css` – Design tokens (colors, spacing, typography, radius). Use `var(--name)` everywhere.
- `reset.css` – Minimal reset for consistent browser defaults.
- `globals.css` – Base body styles and shared utilities (e.g. `.container`).

## Usage

1. **Component styles**: Use CSS Modules (`ComponentName.module.css`) for scoped styles. Import and apply via `className={styles.className}`.

2. **Design tokens**: Use variables instead of magic values.

   ```css
   .card {
     padding: var(--space-md);
     border-radius: var(--radius-lg);
     color: var(--color-text);
     background: var(--color-background);
   }
   ```

3. **New components**: Create `ComponentName/ComponentName.tsx` and `ComponentName/ComponentName.module.css`. Use BEM-like names in the module (e.g. `.card`, `.card__title`, `.card--highlighted`) if you prefer.

4. **Shared layout utilities**: Add to `globals.css` or a new `utilities.css` imported from globals.

## Adding tokens

Extend `variables.css` when you need new values. Keep it as the single source of truth.
