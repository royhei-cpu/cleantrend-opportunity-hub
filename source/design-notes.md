# Homecare visual system

The user's scope is homecare as a whole, and the interface must be simple, organized and easy to navigate. The recorded catalog remains focused on cleaning, laundry and household tools; the visual redesign does not expand verified assortment coverage.

## Direction

- Background: warm ivory `#f7f5ef`.
- Main type: forest `#153f34`; secondary text `#58685e`.
- Structural surfaces: sage `#e3e8d8`; fine olive borders `#a6af8d`.
- Primary actions: copper `#a65e3f` with white text.
- Headings: Georgia serif; body and controls: Arial / Helvetica Neue.
- Navigation: Opportunities, Retailers, All products.
- Keep detailed evidence expandable. Show six opportunities first; make the rest available through one clear control.
- Lifestyle art is illustrative; concept art carries an explicit label. Exact catalog photos are unchanged.
- Motion: short hover transitions, no continuous decorative animation, and reduced-motion support.

## Final asset paths and generation

Both assets were generated with the built-in image tool, then converted to JPEG for website delivery. No CLI image model or external stock-image service was used.

- `assets/homecare-living.jpg`: the final homecare lifestyle hero.
- `assets/calm-still-life.jpg`: an image atlas supplying the two clearly labeled development illustrations, selected with SVG view boxes.

### Hero prompt

Use case: photorealistic-natural. Standalone production hero photograph for Homecare, an attractive calm HOMECARE research website. Wide landscape 16:9 editorial photograph, premium realistic warm daylight. Woven pale laundry basket with oatmeal linen throw at back left, two folded sage towels in front, light wood divided home organizer at right with small unbranded natural hand brush and folded textile, an empty shallow ivory ceramic tray in front, small amber soap pump subtly in background, leafy branch in a stoneware vase at back right. These are illustrative everyday homecare objects, no particular retailer products. Warm ivory plaster wall #f7f5ef and travertine tabletop, soft dappled leaf shadows, calm home setting. Frame the objects around center/right with a small breathing space on left; everything harmonious and uncluttered, basket and home organization as main subjects, not cleaning-bottle advertising. No text, no labels, no brand names, no watermarks, no UI, no montage, no border.

### Concept illustration prompt

Use case: product-mockup. Production photographic asset atlas for the CleanTrend calm editorial web redesign. EXACT three-photo layout on a 1536 by 1536 image: upper photo occupies entire width and top 864 pixels (16:9); lower two distinct photos side by side, each 768 by 672 pixels. Hard straight invisible seam at y=864 and vertical seam x=768 only in bottom part. NO borders, NO text, NO labels, NO logos, NO watermarks, NO UI. Palette warm ivory #f7f5ef, muted sage, dark forest accents, tiny amber and warm stone. Top photo: wide soft daylight still life of unbranded amber reusable spray bottle with dark olive trigger, neatly folded sage microfiber cloth on a shallow cream ceramic tray, small leafy branch behind in pale vase, sculptural travertine stone arch to right, warm ivory wall with soft dappled foliage shadows. Objects centered/right with some breathing room, elegant premium realistic editorial photography, camera level with tabletop, 50 mm lens. Lower LEFT photo: close-up of an unbranded matte ivory telescopic cleaning handle standing in a rounded pale ceramic holder, focus on handle loop, sage wall and soft blurred green foliage. Lower RIGHT photo: close-up of unbranded sage reusable spray bottle with oversized comfortable ivory trigger, folded sage cloth beside it, calm ivory background and soft shadows. These are illustrative development concepts, not branded products and not actual retailer catalog photos. Keep all three images consistent in light, materials, colors and premium photographic quality. No fake branding or product claims.

The generator returned a 1254-square atlas with the horizontal split at approximately y=594; the SVG view boxes use the returned geometry. Only its lower two illustrations appear on the final page. The later whole-home hero replaces the earlier cleaning-led hero direction, as requested by the user.

## Evidence and verification limits

The design concept guides header, hero, palette, type, metrics, horizontal opportunity rows and the small sound capsule. Actual source data and the user's later corrections take precedence over any invented wording or counts in a generated mockup. Existing metadata, product IDs, search and saved records are retained.

The build and 25 automated checks passed. The in-app browser refused local preview twice because its admin-enforced security policy could not be verified. No alternate browser or indirect workaround was used. A native-size screenshot comparison and audible playback review could not be completed; do not claim visual sign-off or a passed browser listening test.
