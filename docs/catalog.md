# Curated destination catalog

Six destinations are available in the selector: Jaipur, Goa, Manali, Rishikesh, Udaipur and Pondicherry. Each has nine destination-specific activities plus the existing shared mood choices.

`server/catalog.ts` uses the same record structure for every destination. Each returned activity has a stable destination-prefixed `id`, `name`, `tags` (balanced/culture/nature) and `estimatedCostInr`. Existing activity IDs retain their ordering. Guide data in `src/planner.ts` supplies three days of suggestions; only destination data was added for this expansion. The selection, day cycling and cost algorithms are unchanged.

## Cost assumptions

Activity costs are illustrative per-adult INR allowances for a self-guided visit or modest meal, using domestic-visitor assumptions where admission differs. They are not confirmed tariffs. Zero means no admission/activity spending is budgeted; it does not mean the entire outing is free. Costs exclude transport, lodging, purchases, donations, guides and optional experiences. Museum entries exclude separately ticketed performances. Walks exclude guided tours and boat rides.

New destination daily planning allowances are ₹2,200 for Rishikesh, ₹2,600 for Udaipur and ₹2,500 for Pondicherry. As before, the trip estimate is daily allowance × days × travellers. Activity estimates are catalog metadata, not added to that estimate: meals can overlap its daily allowance, while admission tickets and paid activities remain excluded from the displayed total. Do not sum both as a complete travel budget.

## Place references

Activity names were checked against official destination references on 10 October 2026. These references establish places, not the illustrative costs above. The runtime uses local curated data and does not browse. Opening hours, access, weather and availability must be checked separately.

- [Uttarakhand Tourism: Rishikesh](https://uttarakhandtourism.gov.in/destination/rishikesh/)
- [Rajasthan Tourism: Udaipur](https://www.tourism.rajasthan.gov.in/udaipur.html)
- [Puducherry Tourism: visitor information](https://pondytourism.py.gov.in/onlinebs/FAQ.aspx)
- [Puducherry Department of Art and Culture: Museum](https://art.py.gov.in/puducherry-museum)
- [Puducherry Government: districts and gardens](https://py.gov.in/districts)
