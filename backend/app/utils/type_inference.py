import pandas as pd
from typing import Set, Tuple
def is_categorical_field(field_name: str, field_values: Set[str]) -> bool:
    MIN_PERCENTAGE = 0.6
    if  _exclude_field_patterns(field_name):
        return False

    f_values_s = pd.Series(list(field_values))
    unique_count = f_values_s.nunique()

    if unique_count < 2:
        return False

    f_values_s_clean = f_values_s.str.strip()
    f_values_s_clean = f_values_s_clean[f_values_s_clean != '']
    total_values = len(f_values_s_clean)

    (numeric_count, code_count) = _sum_field_mask(f_values_s_clean)

    has_special_keywords = f_values_s_clean.str.lower().str.contains('no aplicable|sin |otro', regex=True).any()

    categorical_count = total_values - (numeric_count + code_count)

    if any([numeric_count, code_count]) > total_values * MIN_PERCENTAGE:
        return False

    if categorical_count == 0 and not (numeric_count > 0 and has_special_keywords):
        return False

    return True

def _get_field_mask(f_values_s_clean: pd.Series)-> Tuple[pd.Series, pd.Series, pd.Series]:

    numeric_mask = pd.to_numeric(f_values_s_clean.str.replace('[,.]', '', regex=True), errors='coerce').notna()
    short_code_mask = (
    (f_values_s_clean.str.len() <= 4) &
    (f_values_s_clean.str.replace(' ', '').str.isalnum()) &
    (f_values_s_clean.str.contains(r'[A-Z0-9]', regex=True))
    )

    tech_code_mask = (
        (f_values_s_clean.str.len() > 8) &
        (f_values_s_clean.str.replace('[ \-_]', '', regex=True).str.isalnum()) &
        (f_values_s_clean.str.count(r'[A-Z]') > f_values_s_clean.str.len() * 0.3)
    )

    return (numeric_mask, short_code_mask, tech_code_mask)

def _sum_field_mask(f_values_s_clean: pd.Series)-> Tuple[int, int]:
     (numeric_mask, short_code_mask, tech_code_mask) = _get_field_mask(f_values_s_clean)

     numeric_count = numeric_mask.sum()
     short_code_count = (short_code_mask | tech_code_mask).sum()

     return (numeric_count, short_code_count)

def _exclude_field_patterns(field_name: str) -> bool:
    field_lower = field_name.lower()

    excluded_patterns = ['geom', 'the_geom', 'id', 'objectid', 'rfc', 'codigo',
                        'code', 'extension', 'telefono', 'numero','clave']
    if any(pattern in field_lower for pattern in excluded_patterns):
        return True
