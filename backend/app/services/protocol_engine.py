from datetime import datetime, timezone
from typing import List
from app.schemas.assessment import AssessmentAnswer, VitalsSchema
from app.schemas.clinical import ProtocolResultSchema

class ProtocolEngine:
    @staticmethod
    def evaluate(answers: List[AssessmentAnswer], vitals: VitalsSchema = None) -> ProtocolResultSchema:
        findings = []
        is_high = False
        is_medium = False

        # Scan answers for danger signs
        for ans in answers:
            val_lower = ans.value.lower()
            if any(term in val_lower for term in ["severe", "vomiting", "convulsions", "unconscious", "high fever", "bleeding"]):
                findings.append(f"Danger sign reported: {ans.prompt} ({ans.value})")
                is_high = True
            elif any(term in val_lower for term in ["moderate", "cough", "diarrhea", "pain", "fatigue"]):
                findings.append(f"Finding reported: {ans.prompt} ({ans.value})")
                is_medium = True

        # Scan vitals if present
        if vitals:
            if vitals.temperature and float(vitals.temperature.replace("°C", "").strip() or 37) >= 38.5:
                findings.append(f"High temperature: {vitals.temperature}")
                is_high = True
            if vitals.oxygen and float(vitals.oxygen.replace("%", "").strip() or 98) < 92:
                findings.append(f"Low oxygen saturation: {vitals.oxygen}")
                is_high = True

        now_str = datetime.now(timezone.utc).isoformat()

        if is_high:
            return ProtocolResultSchema(
                riskLevel="HIGH",
                status="REFERRAL_REQUIRED",
                reason="High-risk findings or danger signs detected during clinical evaluation.",
                recommendedAction="Immediate referral to secondary/tertiary facility required within 24 hours.",
                protocolName="Integrated Community Case Management Protocol",
                protocolVersion="2.4",
                generatedAt=now_str,
                triggeringFindings=findings if findings else ["High priority symptoms present"]
            )
        elif is_medium:
            return ProtocolResultSchema(
                riskLevel="MEDIUM",
                status="FOLLOW_UP_REQUIRED",
                reason="Assessment criteria indicate scheduled follow-up is required.",
                recommendedAction="Schedule a community health worker follow-up visit within 72 hours.",
                protocolName="Community Follow-up Protocol",
                protocolVersion="1.9",
                generatedAt=now_str,
                triggeringFindings=findings if findings else ["Moderate symptoms requiring monitoring"]
            )
        else:
            return ProtocolResultSchema(
                riskLevel="LOW",
                status="ROUTINE",
                reason="No urgent danger signs or high-risk criteria identified.",
                recommendedAction="Continue routine care and standard health monitoring.",
                protocolName="Standard Community Health Care Protocol",
                protocolVersion="1.0",
                generatedAt=now_str,
                triggeringFindings=["No danger-sign criteria met", "Routine monitoring interval applies"]
            )

protocol_engine = ProtocolEngine()
