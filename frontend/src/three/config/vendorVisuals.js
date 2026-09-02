/**
 * VENDOR_TYPES from VendorContacts.jsx -> a small subtle shape/color.
 * Spec #45 "Vendor Contacts": "Create a subtle supplier/contact
 * environment ... do NOT create unnecessary heavy 3D. Prioritize
 * contact usability." So this only ever backs a small ~56px badge,
 * never a full scene.
 */
export const VENDOR_VISUALS = {
  'seed dealer': { shape: 'sack', color: '#65a30d' },
  'fertilizer dealer': { shape: 'sack', color: '#a16207' },
  'pesticide dealer': { shape: 'drum', color: '#0891b2' },
  'equipment rental': { shape: 'tool', color: '#64748b' },
  'buyer/trader': { shape: 'cart', color: '#c2410c' },
  transport: { shape: 'truck', color: '#334155' },
  other: { shape: 'crate', color: '#8a8f66' },
};

export function getVendorVisual(type) {
  if (!type) return VENDOR_VISUALS.other;
  const key = type.trim().toLowerCase();
  return VENDOR_VISUALS[key] || VENDOR_VISUALS.other;
}
