import hashlib
import json
import random
from typing import List, Dict, Any

class QualityChecker:
    @staticmethod
    def analyze_samples(commodity: str, variety: str, sample_urls: List[str]) -> Dict[str, Any]:
        if len(sample_urls) < 5:
            return {"error": "Minimum 5 samples required"}
        
        # Simulate analysis
        base_score = random.randint(65, 95)
        scores = [base_score + random.randint(-10, 10) for _ in range(len(sample_urls))]
        scores = [max(40, min(100, s)) for s in scores]
        avg_score = sum(scores) / len(scores)
        
        grade = "A" if avg_score >= 85 else "B" if avg_score >= 70 else "C" if avg_score >= 55 else "D"
        
        return {
            "per_sample": [{"sample_number": i+1, "score": s} for i, s in enumerate(scores)],
            "overall_grade": grade,
            "overall_score": round(avg_score),
            "confidence": 0.85 + random.random() * 0.10,
            "quality_parameters": {
                "appearance": round(avg_score * random.uniform(0.85, 1.0)),
                "color": round(avg_score * random.uniform(0.85, 1.0)),
                "size": round(avg_score * random.uniform(0.85, 1.0)),
                "uniformity": round(avg_score * random.uniform(0.80, 1.0))
            },
            "consistency_note": f"Analysis of {len(sample_urls)} samples",
            "sample_count": len(sample_urls)
        }
    
    @staticmethod
    def compute_hash(data: Dict[str, Any]) -> str:
        return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
