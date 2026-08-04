# Backend flags

Frontend decisions that were deliberately shipped without a backend change, so the gap doesn't get lost.

## Schedule browse-list has no product thumbnails

`GET /customer/pasabuy-schedules` (`CustomerPasabuyScheduleService.fetchOpenSchedules`) returns `ScheduleBrowseItem`: title, description, product_count, dates — no per-schedule product images, even though `Product.image_url` exists in the data model.

`ScheduleBrowseCard.vue` (used on `/customer/pasabuys`) is text-only as a result.

**Fast-follow:** add a representative thumbnail (or small array) to the browse-list response if/when that page gets a visual pass.

## Global product catalog fetched in one page

The customer homepage (`/customer/index.vue`) and `pasabuy/[uuid].vue` both call `publicProductService.fetchCatalog({ per_page: 200 })` and do all filtering/search/pagination client-side over that one page.

**Fast-follow:** if the active catalog grows past ~200 products, this needs real server-side search/pagination on `/public/products` instead of a flat fetch-everything call.
