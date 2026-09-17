# User-supplied vehicle pack

Imported six complete vehicle groups from `LowPoly_Cars_01_fbx.FBX` and the supplied `textures.rar` atlas. Source: ilkhom23, CGTrader, Cars pack 41 objects cars tyres trucks lowpoly. Retains the source license; not represented as CC0. This document is provenance, not a redistribution license.

The illustrated roster replaces the Kenney vehicles with Bairro 4×4, Sertão pickup, Avenida SUV, Expedição pickup, Passeio sedan and Horizonte coupé. Defender stays. The original SUV-Challenge.html is unchanged.

Rebuild imports with scripts/import-car-pack.mjs (requires the supplied Downloads FBX and extracted atlas). Outputs standalone GLBs with UVs, normals and embedded JPEG; all selected child components are retained. Grounding and length are normalized by the existing vehicle loader. Shared atlas colors are preserved underneath the pale shader and multiplicative color tint.

Black contour sampling reduced from 1.0 to 0.6 physical pixels. Optional MALHA FINA control adds antialiased triangle lines over filled surfaces, fading with distance; skips alpha-cut vegetation and transparent glass. Conversion is lazy on first use and increases geometry memory when enabled. It is not a replacement for the contour pass.

Automated checks verify dimensions, grounding, finite geometry, shader injection and toggles. No live GPU visual verification was performed in this session.
