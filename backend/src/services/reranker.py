from typing import List, Dict, Any, Set
from langchain_core.documents import Document

# Dictionary mapping target product noun to companion accessory terms
ACCESSORY_TERMS: Dict[str, List[str]] = {
    "laptop": [
        "bag", "backpack", "desk", "stand", "pad", "sleeve", "cover", "cooler",
        "cooling", "case", "charger", "adapter", "skin", "table", "mouse",
        "keyboard", "cable", "cleaner", "briefcase", "protector", "guard",
        "pouch", "holder", "sticker", "riser", "mat", "hub", "dock", "docking"
    ],
    "phone": [
        "case", "cover", "charger", "cable", "adapter", "protector", "tempered",
        "stand", "holder", "skin", "pouch", "ring", "strap", "mount"
    ],
    "camera": [
        "bag", "backpack", "tripod", "strap", "case", "lens cleaner", "cap",
        "mount", "battery", "filter", "shutter"
    ],
    "tv": [
        "mount", "bracket", "cover", "remote", "stand", "cable", "stabilizer",
        "wall mount"
    ],
    "earbuds": [
        "case", "cover", "strap", "tips", "ear tips", "hook", "cleaner"
    ],
    "headphones": [
        "case", "stand", "hanger", "cushion", "pads", "ear pads", "cable"
    ],
}

# Technical specification hardware terms that indicate an authentic primary computing/tech device
HARDWARE_INDICATORS: Dict[str, List[str]] = {
    "laptop": [
        "intel", "ryzen", "core i", "ssd", "ram", "fhd", "thinkpad",
        "vivobook", "ideapad", "business laptop", "inch", "celeron",
        "processor", "windows", "latitude", "vostro", "pavilion", "inspiron",
        "macbook", "chromebook", "ddr4", "ddr5", "graphics", "ips"
    ],
    "phone": [
        "gb ram", "gb rom", "snapdragon", "dimensity", "bionic", "amoled",
        "smartphone", "5g", "dual sim", "mah battery"
    ],
    "tv": [
        "ultra hd", "4k", "led tv", "smart tv", "oled", "qled", "dolby vision",
        "hdr", "android tv", "google tv"
    ],
}


def rerank_products(query_intent: str, docs: List[Document]) -> List[Document]:
    """
    Applies a lightweight Product-Anchor Re-ranking pass over candidate documents:
    1. Detects if query intent targets a primary device (e.g. laptop, phone, camera, tv).
    2. Checks if query explicitly requested accessories (e.g. 'laptop bag').
    3. If query targets device: penalizes companion accessories and boosts authentic hardware specs.
    4. Preserves vector similarity score as base tie-breaker.
    """
    if not query_intent or not docs:
        return docs

    intent_lower = query_intent.lower()

    # Identify if query targets an anchor product category
    anchor = None
    for k in ACCESSORY_TERMS:
        if k in intent_lower:
            # If the user explicitly asked for an accessory (e.g. 'laptop bag'), do not penalize
            asked_for_accessory = any(acc in intent_lower for acc in ACCESSORY_TERMS[k])
            if not asked_for_accessory:
                anchor = k
                break

    if not anchor:
        return docs

    accessory_words: Set[str] = set(ACCESSORY_TERMS.get(anchor, []))
    hardware_words: List[str] = HARDWARE_INDICATORS.get(anchor, [])

    scored_docs = []
    for idx, doc in enumerate(docs):
        title = doc.page_content.lower()

        # Base score derived from vector retrieval similarity rank (higher rank = higher base)
        score = 2000 - idx

        # Word boundary comparison for accessory tokens
        words = set(title.replace("-", " ").replace(",", " ").replace("/", " ").replace("(", " ").replace(")", " ").split())
        has_accessory = bool(words & accessory_words)

        if has_accessory:
            score -= 1500  # Penalty for accessory companion items

        # Hardware specification boost for authentic devices
        if hardware_words and any(term in title for term in hardware_words):
            score += 500

        scored_docs.append((score, doc))

    scored_docs.sort(key=lambda x: x[0], reverse=True)
    return [d for _, d in scored_docs]
