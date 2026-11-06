
---
name: snapshot-export-validation
description: Validate snapshot rendering and image exports when changing rendering, layout, fonts, or export code.
---

# Snapshot Export Validation

When relevant export or rendering behavior changes:

1. Review the applicable requirements in the PRD.
2. Run existing export regression tests.
3. Verify all affected output formats:
   - PNG: transparency and resolution
   - SVG: vector output and font compatibility
   - JPG: opaque background and color accuracy
   - WebP: transparency and image quality
4. Test short, long, multiline, and Unicode code.
5. Compare outputs with approved visual fixtures.
6. Report failures with reproducible evidence.

Do not approve rendering changes based on a screenshot alone.
