"""Generate deterministic datasets for the FDE project handbook.

Outputs under /home/z/my-project/download/fde_projects/datasets/:
  sales_data_raw.csv   dirty sales data (missing values, casing chaos, duplicates)
  feedback_tickets.csv support tickets with ratings and comments
  faq_support.md       FAQ knowledge base for the support assistant
  legal_docs/*.txt     six invented memos for the document-search project
"""
import csv
import os
import random

OUT = "/home/z/my-project/download/fde_projects/datasets"
os.makedirs(OUT + "/legal_docs", exist_ok=True)

random.seed(42)

# ---------------------------------------------------------------- sales data (dirty)
REGIONS = ["north", "NORTH", "North", "South", "SOUTH", "south", "East", "east", "WEST", "West"]
PRODUCTS = ["Loaf Bread", "Croissant", "Sourdough", "Cinnamon Roll", "Bagel"]
CHANNELS = ["store", "online", "Store", "Online", "app"]
rows = []
for day in range(1, 29):  # four weeks of February 2026
    date = "2026-02-%02d" % day
    for _ in range(5):
        product = random.choice(PRODUCTS)
        region = random.choice(REGIONS)
        channel = random.choice(CHANNELS)
        units = random.randint(1, 40)
        price = {"Loaf Bread": 3.5, "Croissant": 4.25, "Sourdough": 6.0,
                 "Cinnamon Roll": 3.75, "Bagel": 2.5}[product]
        discount = random.choice([0, 0, 0, 10, 20])
        rows.append([date, region, product, units, price, discount, channel])

# inject dirt: 6 rows with missing units, 4 duplicate rows, 2 bad dates, casing chaos stays
dirty = [list(r) for r in rows]
random.seed(7)
for i in random.sample(range(len(dirty)), 6):
    dirty[i][3] = ""  # missing units
for r in random.sample(dirty, 4):
    dirty.append(list(r))  # duplicates
for i in (11, 29):
    dirty[i][0] = "2026-13-05"  # impossible month

with open(OUT + "/sales_data_raw.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["date", "region", "product", "units", "unit_price", "discount_pct", "channel"])
    w.writerows(dirty)
print("sales_data_raw.csv:", len(dirty), "rows (dirty on purpose)")

# ---------------------------------------------------------------- feedback tickets
COMMENTS = {
    5: ["The assistant answered instantly and fixed my issue.", "Perfect, no follow-up needed.",
        "Very clear instructions, problem solved."],
    4: ["Good answer, slightly slow.", "Helpful, but I had to ask once more.", "Solved it, thanks."],
    3: ["Answer was okay but generic.", "Took two attempts to understand my question.", "Fine overall."],
    2: ["Did not understand my question at all.", "The suggested steps did not work.", "Too slow, I gave up."],
    1: ["Completely wrong answer.", "I had to call a human anyway.", "Unhelpful and confusing."],
}
CHANNELS = ["web", "email", "phone"]
CATEGORIES = ["orders", "returns", "billing", "delivery", "account"]
with open(OUT + "/feedback_tickets.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["ticket_id", "date", "channel", "category", "rating", "comment", "escalated"])
    tid = 1000
    for day in range(1, 31):
        date = "2026-03-%02d" % day
        for _ in range(3):
            tid += 1
            rating = random.choices([5, 4, 3, 2, 1], weights=[30, 30, 20, 12, 8])[0]
            w.writerow([tid, date, random.choice(CHANNELS), random.choice(CATEGORIES),
                        rating, random.choice(COMMENTS[rating]),
                        "yes" if rating <= 2 else "no"])
print("feedback_tickets.csv:", tid - 1000, "tickets")

# ---------------------------------------------------------------- FAQ knowledge base
faq = """# BrightCart Support FAQ

Q: Where is my order?
A: Open BrightCart, go to Orders, and tap the order number. The tracking page shows the
carrier, the tracking code, and the estimated delivery date. Orders leave our warehouse
within one business day.

Q: How do I return an item?
A: Go to Orders, choose the order, tap Return item, pick a reason, and print the prepaid
label. Returns are accepted within 30 days of delivery. Refunds land on the original
payment method within 5 business days of our warehouse receiving the item.

Q: My payment failed but money left my account. What now?
A: Failed authorizations release automatically within 5 business days; your bank controls
the timing. No duplicate charge happens when an order fails. If it takes longer, contact
us with the last four digits of your card.

Q: How do I change my delivery address?
A: Address changes are possible until the order status becomes Packed. Open the order,
tap Edit address, and save. After packing, the carrier label is fixed and the parcel must
be redirected through the carrier's own service.

Q: Do you ship internationally?
A: We ship to 14 countries. Shipping cost and delivery time are shown at checkout once
you enter the delivery country. Customs duties, where they apply, are collected by the
carrier on delivery.

Q: How do I reset my password?
A: On the sign-in screen tap Forgot password, enter your email, and follow the link we
send. The link is valid for 30 minutes. Passwords must be at least 10 characters long.

Q: Where is my invoice?
A: Invoices appear in Orders under View invoice within one hour of payment. Business
accounts can download monthly consolidated invoices from Account, then Billing.

Q: My discount code did not work. Why?
A: Codes apply to full-price items only, one code per order, and some codes exclude
certain regions shown in the offer's terms. Check the code's expiry date in Account,
then Offers.
"""
with open(OUT + "/faq_support.md", "w") as f:
    f.write(faq)
print("faq_support.md: 8 Q/A pairs")

# ---------------------------------------------------------------- legal memos (invented, safe)
memos = {
    "memo_001_nda_template.txt": """MEMO 001 - Standard NDA Template Notes
Halewood & Partners, internal guidance (training material, invented).

The firm's mutual non-disclosure agreement template is NDA-2024-M. It covers
confidential information definitions, a five-year term, and carve-outs for
information that is public, independently developed, or lawfully received.
The signature block requires one authorised partner signature per party.
Client matters involving employee data use the NDA-2024-E variant instead,
which adds a data-processing schedule.""",
    "memo_002_retainer_policy.txt": """MEMO 002 - Retainer and Escrow Policy
Client retainers are held in the firm's escrow account at Meridian Bank.
Funds are drawn monthly against recorded time entries after partner review.
A retainer below 25 percent of the estimated matter budget triggers a
replenishment request to the client. Unused retainer balances are refunded
within 30 days of matter closure.""",
    "memo_003_precedent_compliance.txt": """MEMO 003 - Precedent Search Compliance Note
When preparing briefs, associates must record every precedent relied upon
in the matter file, including the citation, the court, and the passage used.
Precedents older than ten years require a partner check before citation.
Searches performed with the firm's research tools are logged automatically;
manual database searches must be noted in the matter file the same day.""",
    "memo_004_data_retention.txt": """MEMO 004 - Document Retention Schedule
Matter documents are retained for seven years after matter closure, then
reviewed. Documents flagged litigation-hold are excluded from destruction
until the hold is released. Client original documents are returned on
request; scanned copies remain in the archive. Destruction requires two
authorised signatures and an entry in the destruction register.""",
    "memo_005_conflict_check.txt": """MEMO 005 - Conflict of Interest Check Procedure
Every new matter runs a conflict check against the client and adverse
party database before opening. Checks cover current clients, former
clients within the retention window, and related entities by registration
number. A potential conflict escalates to the general counsel, who decides
within two business days. Matters may not open while a check is pending.""",
    "memo_006_billing_codes.txt": """MEMO 006 - Billing Code Reference
Time entries use the firm's billing codes: LIT for litigation, COR for
corporate, REG for regulatory, IP for intellectual property, and GEN for
general advisory. Each code carries a standard hourly rate band. Codes are
reviewed every January; entries recorded under retired codes are remapped
by the finance team during the January close.""",
}
for name, text in memos.items():
    with open(OUT + "/legal_docs/" + name, "w") as f:
        f.write(text)
print("legal_docs:", len(memos), "memos")
