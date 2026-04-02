# FrameKart — Cloudinary Assets

All assets uploaded to cloud name: `dddgabu7o`
Folder structure: `framekart/gigs/` and `framekart/avatars/`

## Gig Images (seeded into demo data)

| Gig | Cloudinary URL |
|---|---|
| Wedding Photography | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775121546/framekart/gigs/wedding-photography-1.jpg` |
| Videography Wedding | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775148672/framekart/gigs/videography-wedding-1.jpg` |
| Drone Aerial | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775148677/framekart/gigs/drone-aerial-1.jpg` |
| Album Design | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775148681/framekart/gigs/album-design-1.jpg` |
| Video Editing Reels | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775148688/framekart/gigs/video-editing-reels-1.jpg` |
| Corporate Event | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775148692/framekart/gigs/corporate-event-photography-1.jpg` |

## Provider Avatars (seeded into demo accounts)

| Provider | Cloudinary URL |
|---|---|
| Arjun Mehta | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775148700/framekart/avatars/demo-arjun.jpg` |
| Priya Sharma | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775148705/framekart/avatars/demo-priya.jpg` |
| Ravi Kumar | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775148708/framekart/avatars/demo-ravi.jpg` |
| Sneha Patel | `https://res.cloudinary.com/dddgabu7o/image/upload/v1775148712/framekart/avatars/demo-sneha.jpg` |

## Cloudinary Transformations (use in frontend)

All Cloudinary URLs support on-the-fly transformations via URL params:

```
# Resize gig card thumbnail (300x200, auto quality, WebP)
https://res.cloudinary.com/dddgabu7o/image/upload/w_300,h_200,c_fill,q_auto,f_auto/framekart/gigs/wedding-photography-1.jpg

# Avatar circle (64x64, face crop)
https://res.cloudinary.com/dddgabu7o/image/upload/w_64,h_64,c_fill,g_face,r_max,q_auto/framekart/avatars/demo-arjun.jpg

# Hero banner (1200px wide, optimised)
https://res.cloudinary.com/dddgabu7o/image/upload/w_1200,q_auto,f_auto/framekart/gigs/wedding-photography-1.jpg
```

Add these transform strings to your `lib/api.js` or a `cloudinary.js` util:

```js
export const CLOUD = "dddgabu7o";

export function gigThumb(url) {
  return url?.replace("/upload/", "/upload/w_600,h_400,c_fill,q_auto,f_auto/");
}

export function avatar(url, size = 64) {
  return url?.replace("/upload/", `/upload/w_${size},h_${size},c_fill,g_face,r_max,q_auto/`);
}
```
