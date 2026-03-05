# /public/logo.png

Place your Grails logo PNG here at `public/logo.png`.

The file is imported in:
  - components/Nav.tsx (via Next.js Image)
  - app/page.tsx (passed to LogoScreensaver)

The logo that was embedded as base64 in the old index.html can be exported
from the browser or decoded from the base64 string in the original HTML.

To extract it:
  node -e "
    const fs = require('fs');
    const b64 = '<paste base64 string here>';
    fs.writeFileSync('public/logo.png', Buffer.from(b64, 'base64'));
  "
