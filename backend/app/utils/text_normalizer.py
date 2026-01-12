import unicodedata
from functools import lru_cache

@lru_cache(maxsize=1000)
def text_normalizer(text):
    text = text.replace("_", " ")
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return text.lower()
