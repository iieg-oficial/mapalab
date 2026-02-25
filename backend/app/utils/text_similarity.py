from rapidfuzz import fuzz

def text_similarity(
        text: str,
        query: str,
        similarity_threshold: int = 85
    ) -> bool:
    similarity = fuzz.token_set_ratio(query, text)
    return similarity >= similarity_threshold
