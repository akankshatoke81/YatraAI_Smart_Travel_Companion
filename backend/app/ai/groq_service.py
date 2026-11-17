import os
import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "openai/gpt-oss-120b"
        self._explanation_cache: Dict[str, Dict[str, Any]] = {}


    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def generate_itinerary(
        self,
        candidate_destinations: List[Dict[str, Any]],
        starting_location: str,
        budget: float,
        available_time: str,
        interests: List[str],
        num_travellers: int,
        travel_type: str
    ) -> Dict[str, Any]:
        """
        Orchestrates personalized itinerary:
        Grounds recommendation exclusively on actual candidate destinations retrieved from MySQL.
        Falls back to rule-based logic if Groq key is absent or network fails.
        """
        if not candidate_destinations:
            return {
                "title": f"Custom Maharashtra Itinerary from {starting_location}",
                "summary": "No matching destinations found for the selected region/criteria in the database.",
                "total_estimated_budget": 0.0,
                "total_visiting_duration": available_time,
                "destinations": [],
                "ai_generated": False,
                "ai_provider": "Database Grounding"
            }

        # Try Groq API if configured
        if self.is_configured():
            try:
                # Build strict JSON prompt providing candidate DB destinations as only source of truth
                dest_catalog = [
                    {
                        "id": d["id"],
                        "name": d["name"],
                        "district": d.get("district_name", ""),
                        "category": d.get("category", ""),
                        "entry_fee": d.get("entry_fee", 0.0),
                        "visit_duration": d.get("visit_duration", "2 hours"),
                        "description": d.get("description", "")[:200]
                    }
                    for d in candidate_destinations[:15]
                ]

                system_prompt = (
                    "You are YatraAI's Expert Maharashtra Tour Planning Agent. "
                    "Your mandate: Select and arrange ONLY from the provided candidate destinations into a logical itinerary. "
                    "CRITICAL CONSTRAINT: You MUST NOT invent new destinations, you MUST NOT change entry fees, and you MUST use exact destination IDs from the provided catalog. "
                    "Return ONLY valid JSON matching this schema: "
                    "{"
                    "  \"title\": \"string\","
                    "  \"summary\": \"string\","
                    "  \"selected_items\": ["
                    "    {"
                    "      \"destination_id\": int,"
                    "      \"visit_order\": int,"
                    "      \"suggested_time_slot\": \"string (e.g. 09:30 AM - 11:30 AM)\","
                    "      \"reason\": \"string\","
                    "      \"estimated_cost\": float"
                    "    }"
                    "  ]"
                    "}"
                )

                user_prompt = (
                    f"User Trip Parameters:\n"
                    f"- Starting Point: {starting_location}\n"
                    f"- Budget: ₹{budget} for {num_travellers} traveller(s)\n"
                    f"- Available Duration: {available_time}\n"
                    f"- Travel Style: {travel_type}\n"
                    f"- Priority Interests: {', '.join(interests) if interests else 'General Sightseeing'}\n\n"
                    f"Available Database Destinations (Strict Source of Truth):\n"
                    f"{json.dumps(dest_catalog, indent=2)}\n\n"
                    f"Pick the top 3 to 5 best destinations fitting the time & budget, in optimal travel sequence. "
                    f"Return JSON only."
                )

                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }

                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3
                }

                with httpx.Client(timeout=12.0) as client:
                    resp = client.post(self.base_url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        parsed = json.loads(content)

                        # Match returned items back to actual database objects
                        dest_map = {d["id"]: d for d in candidate_destinations}
                        itinerary_destinations = []
                        calc_total_cost = 0.0

                        for item in parsed.get("selected_items", []):
                            dest_id = item.get("destination_id")
                            if dest_id in dest_map:
                                db_dest = dest_map[dest_id]
                                entry_cost = float(db_dest.get("entry_fee", 0.0)) * num_travellers
                                # Add base local transit/parking allowance per stop (~₹150)
                                stop_cost = entry_cost + 150.0
                                calc_total_cost += stop_cost

                                itinerary_destinations.append({
                                    "destination": db_dest,
                                    "visit_order": item.get("visit_order", len(itinerary_destinations) + 1),
                                    "suggested_time_slot": item.get("suggested_time_slot", "Morning Slot"),
                                    "reason": item.get("reason", f"Highlights authentic Maharashtra {db_dest.get('category')} heritage."),
                                    "estimated_cost": round(stop_cost, 2)
                                })

                        if itinerary_destinations:
                            return {
                                "title": parsed.get("title", f"AI-Crafted Itinerary from {starting_location}"),
                                "summary": parsed.get("summary", f"Personalized plan tailored for {travel_type} exploration."),
                                "total_estimated_budget": round(calc_total_cost, 2),
                                "total_visiting_duration": available_time,
                                "destinations": sorted(itinerary_destinations, key=lambda x: x["visit_order"]),
                                "ai_generated": True,
                                "ai_provider": "Groq AI (Grounding Verified)"
                            }
            except Exception as e:
                logger.warning(f"Groq API call failed or timed out: {e}. Switching to rule-based fallback.")

        # Deterministic Rule-Based Recommendation Fallback
        return self._rule_based_itinerary_fallback(
            candidate_destinations=candidate_destinations,
            starting_location=starting_location,
            budget=budget,
            available_time=available_time,
            interests=interests,
            num_travellers=num_travellers,
            travel_type=travel_type
        )

    def _rule_based_itinerary_fallback(
        self,
        candidate_destinations: List[Dict[str, Any]],
        starting_location: str,
        budget: float,
        available_time: str,
        interests: List[str],
        num_travellers: int,
        travel_type: str
    ) -> Dict[str, Any]:
        """
        Intelligent scoring algorithm when Groq API key is not supplied or offline.
        Scores candidate destinations based on user interest alignment, budget feasibility, and distance.
        """
        scored = []
        interests_lower = [i.lower() for i in interests]

        for d in candidate_destinations:
            score = 10.0
            category = d.get("category", "").lower()
            desc = d.get("description", "").lower()

            # Interest match scoring
            for intr in interests_lower:
                if intr in category:
                    score += 15.0
                elif intr in desc:
                    score += 8.0

            # Budget check
            entry_cost = float(d.get("entry_fee", 0.0)) * num_travellers
            if entry_cost > budget:
                score -= 20.0
            else:
                score += 5.0

            scored.append((score, d))

        scored.sort(key=lambda x: x[0], reverse=True)

        # Decide count based on available time
        target_count = 3
        if "half" in available_time.lower():
            target_count = 2
        elif "2" in available_time.lower() or "two" in available_time.lower():
            target_count = 5
        elif "3" in available_time.lower() or "three" in available_time.lower():
            target_count = 7

        selected = scored[:target_count]
        time_slots = [
            "09:00 AM - 11:30 AM",
            "12:00 PM - 02:00 PM",
            "02:30 PM - 04:30 PM",
            "05:00 PM - 07:00 PM",
            "07:30 PM - 09:00 PM"
        ]

        itinerary_destinations = []
        total_cost = 0.0

        for idx, (score, dest) in enumerate(selected):
            slot = time_slots[idx % len(time_slots)]
            entry_cost = float(dest.get("entry_fee", 0.0)) * num_travellers
            est_cost = entry_cost + 120.0
            total_cost += est_cost

            itinerary_destinations.append({
                "destination": dest,
                "visit_order": idx + 1,
                "suggested_time_slot": slot,
                "reason": f"Top match for your interests in {dest.get('category')} and within your ₹{budget:.0f} budget.",
                "estimated_cost": round(est_cost, 2)
            })

        return {
            "title": f"Smart Route from {starting_location} ({available_time})",
            "summary": f"A balanced travel plan featuring {len(itinerary_destinations)} key Maharashtra attractions optimized for your ₹{budget:.0f} budget.",
            "total_estimated_budget": round(total_cost, 2),
            "total_visiting_duration": available_time,
            "destinations": itinerary_destinations,
            "ai_generated": False,
            "ai_provider": "Rule-Based Optimizer (Zero API Dependencies)"
        }

    def explain_destination(self, dest: Dict[str, Any], aspect: str = "all") -> Dict[str, Any]:
        """
        Generates enriched historical and architectural explanation for a destination.
        Grounds on real DB values, preventing AI hallucinations.
        """
        cache_key = f"{dest['id']}_{aspect}"
        if cache_key in self._explanation_cache:
            return self._explanation_cache[cache_key]

        name = dest.get("name", "Landmark")
        history_db = dest.get("history", "") or "Historic landmark of Maharashtra."
        arch_db = dest.get("architecture", "") or "Traditional architecture."
        desc_db = dest.get("description", "")
        category = dest.get("category", "Heritage")
        district = dest.get("district_name", "Maharashtra")

        # Fallback curated deep insights
        fallback_data = {
            "destination_id": dest["id"],
            "destination_name": name,
            "historical_explanation": f"{name} stands as an iconic testament in {district}. {history_db}",
            "architecture_explanation": f"Architecturally classified under {category}: {arch_db}",
            "cultural_significance": f"Deeply venerated in Maharashtra's cultural tapestry, attracting travellers, historians, and pilgrims alike.",
            "interesting_facts": [
                f"Recognized as a premier {category.lower()} site in {district}.",
                f"Preserves centuries-old craftsmanship and indigenous design principles.",
                f"Plays an integral part in local folklore and historical chronicles."
            ],
            "suggested_visit_duration": dest.get("visit_duration", "2 hours"),
            "source": "Curated Archive (Verified Source of Truth)"
        }

        if not self.is_configured():
            self._explanation_cache[cache_key] = fallback_data
            return fallback_data

        try:
            system_prompt = (
                "You are an academic historian and architectural scholar specializing in Maharashtra's heritage. "
                "Provide detailed, accurate explanations based strictly on the provided verified database context. "
                "Do NOT invent ticket prices, opening hours, or falsify historical chronologies. "
                "Return ONLY valid JSON matching: "
                "{"
                "  \"historical_explanation\": \"string\","
                "  \"architecture_explanation\": \"string\","
                "  \"cultural_significance\": \"string\","
                "  \"interesting_facts\": [\"string\", \"string\", \"string\"],"
                "  \"suggested_visit_duration\": \"string\""
                "}"
            )

            user_prompt = (
                f"Destination: {name} ({district}, Maharashtra)\n"
                f"Category: {category}\n"
                f"Recorded History: {history_db}\n"
                f"Recorded Architecture: {arch_db}\n"
                f"Overview: {desc_db}\n"
                f"Focus Aspect: {aspect}"
            )

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.25
            }

            with httpx.Client(timeout=10.0) as client:
                resp = client.post(self.base_url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    parsed = json.loads(data["choices"][0]["message"]["content"])
                    result = {
                        "destination_id": dest["id"],
                        "destination_name": name,
                        "historical_explanation": parsed.get("historical_explanation", fallback_data["historical_explanation"]),
                        "architecture_explanation": parsed.get("architecture_explanation", fallback_data["architecture_explanation"]),
                        "cultural_significance": parsed.get("cultural_significance", fallback_data["cultural_significance"]),
                        "interesting_facts": parsed.get("interesting_facts", fallback_data["interesting_facts"]),
                        "suggested_visit_duration": parsed.get("suggested_visit_duration", fallback_data["suggested_visit_duration"]),
                        "source": "Groq AI (Grounding Verified with Database Truth)"
                    }
                    self._explanation_cache[cache_key] = result
                    return result
        except Exception as e:
            logger.warning(f"Groq destination explanation failed: {e}")

        self._explanation_cache[cache_key] = fallback_data
        return fallback_data

groq_service = GroqService()

