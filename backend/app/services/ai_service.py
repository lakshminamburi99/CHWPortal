"""
Google Gemini AI Service:
- Multilingual Voice & Narrative Clinical Entity Extraction
- Automated Supervisor Case Summarization
- Resilient fallback logic when offline or API key is omitted
"""
import json
import os
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any
from app.config import settings


class GeminiAIService:
    @staticmethod
    def _get_api_key() -> Optional[str]:
        return settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")

    @classmethod
    def call_gemini(cls, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        api_key = cls._get_api_key()
        if not api_key:
            return None

        model = settings.GEMINI_MODEL or "gemini-2.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }

        if system_instruction:
            payload["system_instruction"] = {
                "parts": [{"text": system_instruction}]
            }

        headers = {"Content-Type": "application/json"}

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    res_body = json.loads(response.read().decode("utf-8"))
                    candidates = res_body.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
        except Exception as e:
            print(f"[GeminiAIService] API call error: {e}")
        return None

    @classmethod
    def transcribe_and_extract_entities(
        cls,
        options: Optional[List[str]] = None,
        audio_transcript: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uses Gemini to extract structured clinical entities from voice narrative
        and match against available assessment question options.
        """
        sample_transcripts = [
            "The child has been vomiting continuously since morning and cannot keep fluids down.",
            "Patient reports high fever for 3 days and severe headache with chills.",
            "Infant is lethargic, breathing rapidly, and has chest indrawing.",
            "Caregiver states child is drinking fluids normally and fever has reduced.",
        ]
        transcript = audio_transcript or sample_transcripts[0]
        options_list = options or []

        prompt = f"""
Clinical narrative: "{transcript}"
Available options: {json.dumps(options_list)}

Analyze the narrative and return a JSON object with:
1. "transcript": The transcript string.
2. "suggestedOption": The single option from available options that best matches the clinical narrative (or null if none match).
3. "extracted_vitals": Object containing clinical vitals or symptoms mentioned (e.g. fever, vomiting, breathing_rate).
"""
        system_instruction = "You are a clinical AI assistant parsing frontline Community Health Worker narrative notes. Return raw valid JSON only."

        gemini_res = cls.call_gemini(prompt, system_instruction)
        if gemini_res:
            try:
                # Clean code blocks if present
                clean_text = gemini_res.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                parsed = json.loads(clean_text.strip())
                return {
                    "transcript": parsed.get("transcript", transcript),
                    "suggestedOption": parsed.get("suggestedOption") or (options_list[0] if options_list else None),
                    "extracted_vitals": parsed.get("extracted_vitals", {}),
                    "ai_powered": True
                }
            except Exception:
                pass

        # Resilient Fallback Logic
        matched_option = None
        lower_trans = transcript.lower()
        if options_list:
            for opt in options_list:
                if any(word in lower_trans for word in opt.lower().split()):
                    matched_option = opt
                    break
            if not matched_option:
                matched_option = options_list[0]

        return {
            "transcript": transcript,
            "suggestedOption": matched_option,
            "extracted_vitals": {
                "symptoms": [word for word in ["fever", "vomiting", "headache", "cough", "lethargy"] if word in lower_trans]
            },
            "ai_powered": False
        }

    @classmethod
    def summarize_case(cls, case_data: Dict[str, Any]) -> str:
        """
        Generates a 3-bullet clinical action brief for a supervisor reviewing an escalated case.
        """
        patient_name = case_data.get("patient_name", "Patient")
        risk_level = case_data.get("risk_level", "HIGH")
        danger_flags = case_data.get("danger_flags", [])
        vitals = case_data.get("vitals", {})

        prompt = f"""
Case Details for {patient_name}:
- Risk Level: {risk_level}
- Triggered Danger Flags: {json.dumps(danger_flags)}
- Vitals / Symptoms: {json.dumps(vitals)}

Provide a concise 3-bullet clinical supervisor handoff summary:
1. Key Clinical Concern
2. Recommended Immediate Action
3. CHW Coaching Point
"""
        system_instruction = "You are an expert pediatric clinical supervisor writing concise action briefs for frontline health workers."

        gemini_res = cls.call_gemini(prompt, system_instruction)
        if gemini_res:
            return gemini_res.strip()

        # Resilient Fallback Brief
        flags_str = ", ".join(danger_flags) if danger_flags else "Protocol risk flags triggered"
        return (
            f"• **Key Clinical Concern**: Patient flagged at {risk_level} risk level due to {flags_str}.\n"
            f"• **Recommended Immediate Action**: Coordinate prompt referral to district health facility and confirm transport.\n"
            f"• **CHW Coaching Point**: Re-assess hydration status and record hourly vital signs until referral handover."
        )
