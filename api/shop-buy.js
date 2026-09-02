const { requireUser, AuthError } = require('./_lib/auth');
const { db, getOrCreateUser } = require('./_lib/db');
const { SHOP_ITEMS } = require('./_lib/shop');

// Two optional, Layout-only extensions to the plain whole-closet buy, both
// writing closet_state.layout_by_section (a plain {sectionIndex: layoutId}
// map, mirroring st.equippedLayoutBySection on the client):
//
// `sectionIndex` - present when a Layout card was DRAGGED onto one section
// of the 3D closet (see index.html's endClosetLayoutDrag) rather than
// clicked. Merges { [sectionIndex]: item.layoutId } into the existing map.
//
// `resetSections` - present when a Layout card was CLICKED (the plain
// whole-closet equip, see buy() in index.html). A whole-closet re-plan
// (applyMultiClosetSections, via apply3DClosetLayout) should always win
// outright over any earlier per-section drag-drop tweak rather than have
// apply3DClosetSectionOverrides silently re-assert a stale one-section
// choice on top of it at the next unrelated render - so a plain equip
// always clears the whole map, even when nothing is being charged (tapping
// an already-owned whole-closet layout to re-equip it still needs to reach
// the server to clear this, since it has no other event that would).
//
// Both left OFF (the original request shape) makes this endpoint behave
// exactly as it always did - a plain whole-closet buy.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const identity = await requireUser(req);
    const user = await getOrCreateUser(identity);
    const { itemId, sectionIndex, resetSections } = req.body || {};
    const item = SHOP_ITEMS[itemId];
    if (!item) return res.status(400).json({ error: 'Unknown itemId' });

    const hasSectionIndex = sectionIndex !== undefined && sectionIndex !== null;
    if (hasSectionIndex && (item.category !== 'layout' || !Number.isInteger(sectionIndex) || sectionIndex < 0)) {
      return res.status(400).json({ error: 'Invalid sectionIndex' });
    }
    if (resetSections && item.category !== 'layout') {
      return res.status(400).json({ error: 'Invalid resetSections' });
    }
    // Either extension means this call must be allowed to succeed for an
    // item the designer ALREADY owns (a second drag onto another section,
    // or re-tapping an owned whole-closet layout, are both free - already
    // paid for once) - so ownership has to be checked up front here rather
    // than inferred from an insert's dupe error, which the plain (neither
    // extension) path below still uses for backward compatibility.
    const needsOwnershipCheck = (hasSectionIndex || resetSections) && itemId !== 'levelup';

    const supabase = db();

    let alreadyOwned = false;
    if (needsOwnershipCheck) {
      const { data: existing } = await supabase.from('shop_purchases').select('item_id').eq('user_id', user.id).eq('item_id', itemId).maybeSingle();
      alreadyOwned = !!existing;
    }

    if (!alreadyOwned) {
      const price = item.price;
      const { data: balanceRow } = await supabase.from('user_balances').select('tokens').eq('user_id', user.id).maybeSingle();
      const tokens = balanceRow ? balanceRow.tokens : 0;
      if (tokens < price) return res.status(400).json({ error: 'Not enough moon rocks' });

      if (itemId === 'levelup') {
        const { data: closet } = await supabase.from('closet_state').select('visits').eq('user_id', user.id).single();
        await supabase.from('closet_state').update({ visits: closet.visits + 1 }).eq('user_id', user.id);
      } else {
        const { error: dupeError } = await supabase.from('shop_purchases').insert({ user_id: user.id, item_id: itemId });
        if (dupeError) {
          if (dupeError.code === '23505') {
            // Only fatal on the plain path (matches the original behaviour
            // exactly). With either extension this just means we lost a
            // race with a concurrent purchase - fine, treat it as already
            // owned and fall through to the layout_by_section write below.
            if (!needsOwnershipCheck) return res.status(400).json({ error: 'Already owned' });
          } else {
            throw dupeError;
          }
        }
      }

      await supabase.from('moon_rock_events').insert({ user_id: user.id, amount: -price, reason: `shop_purchase:${itemId}` });
    }

    if (hasSectionIndex || resetSections) {
      const { data: closet } = await supabase.from('closet_state').select('layout_by_section').eq('user_id', user.id).single();
      const bySection = resetSections ? {} : Object.assign({}, closet && closet.layout_by_section);
      if (hasSectionIndex) bySection[String(sectionIndex)] = item.layoutId;
      await supabase.from('closet_state').update({ layout_by_section: bySection }).eq('user_id', user.id);
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
};
