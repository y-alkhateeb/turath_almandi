# Login Background Image

## How to Add the Login Background Image

1. **Download the image** from the URL or use your preferred image
2. **Save it** to this directory as `login-bg.jpg`
3. **Update the configuration** in `src/global-config.ts`:
   - Change `useFallbackGradient` from `true` to `false`

## Image Requirements

- **Recommended size:** 1920x1080px or higher
- **Format:** JPG, PNG, or WebP
- **Aspect ratio:** 16:9 works best
- **File name:** `login-bg.jpg` (or update the path in global-config.ts)

## Current Image URL

The current recommended image is available at:
```
https://scontent-ham3-1.xx.fbcdn.net/v/t39.30808-6/490910684_606105959129344_589045621789059215_n.jpg
```

Note: You'll need to manually download this image as Facebook CDN blocks automated downloads.

## Making it Admin-Configurable (Future Enhancement)

To allow admins to change the login image from the dashboard:

1. Add a settings page with image upload capability
2. Store the image path in the database or local storage
3. Update GLOBAL_CONFIG to read from that setting
4. Use the Settings API to manage the configuration

## Example Configuration

In `src/global-config.ts`:

```typescript
// When using an image:
const loginBackgroundImage = '/images/login-bg.jpg';
const useFallbackGradient = false;

// When using gradient fallback:
const loginBackgroundImage = '/images/login-bg.jpg';
const useFallbackGradient = true;
```
