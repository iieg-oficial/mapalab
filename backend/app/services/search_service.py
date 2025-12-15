from typing import Dict, List

from app.services.search_cache_service import SearchCacheService
from app.services.geoserver_service import GeoServerService
from app.utils.text_normalizer import text_normalizer
from app.utils.text_similarity import text_similarity
from app.utils.logger import Logger

class SearchService:

    @staticmethod
    def search(query: str) -> Dict:
        normalized_query = text_normalizer(query)

        layer_matches = SearchService._search_layer_names(normalized_query)
        field_matches = SearchService._search_field_values(normalized_query)

        all_matches = layer_matches + field_matches
        all_matches.sort(key=lambda x: SearchService._match_priority(x))

        return {
            "query": query,
            "matches": all_matches
        }


    @staticmethod
    def _match_priority(match: Dict) -> tuple:
        similarity = match.get("max_similarity", 85)
        is_exact = similarity == 100
        is_layer = match["match_type"] == "layer_name"
        value_count = len(match.get("values") or [])

        return (
            0 if is_exact else 1,
            0 if is_layer else 1,
            -similarity,
            -value_count
        )

    @staticmethod
    def _search_layer_names(normalized_query: str) -> List[Dict]:
        matches = []

        try:
            workspaces = GeoServerService.get_workspaces()

            for workspace in workspaces:
                workspace_matches = SearchService._search_workspace_layers(
                    workspace,
                    normalized_query
                )
                matches.extend(workspace_matches)

        except Exception as e:
            Logger.error(f"Error searching layer names: {str(e)}")

        return matches

    @staticmethod
    def _search_workspace_layers(
            workspace: str,
            normalized_query: str
        ) -> List[Dict]:
        matches = []
        layers = GeoServerService.get_layers(workspace)

        for layer in layers:
            normalized_layer = text_normalizer(layer)
            if text_similarity(normalized_layer, normalized_query):
                matches.append(SearchService._create_layer_match(workspace, layer))

        return matches

    @staticmethod
    def _create_layer_match(
            workspace: str,
            layer: str
        ) -> Dict:
        return {
            "workspace": workspace,
            "layer": layer,
            "field": None,
            "values": None,
            "cql_filter": None,
            "match_type": "layer_name"
        }

    @staticmethod
    def _search_field_values(normalized_query: str) -> List[Dict]:
        cache = SearchCacheService.get_mapalab_cache()
        matches = []

        for layer_key, layer_data in cache.get("layers", {}).items():
            layer_matches = SearchService._search_layer_fields(
                layer_key,
                layer_data,
                normalized_query
            )
            matches.extend(layer_matches)

        return matches

    @staticmethod
    def _search_layer_fields(
            layer_key: str,
            layer_data: Dict,
            normalized_query: str
        ) -> List[Dict]:
        workspace, layer = layer_key.split(":")
        categorical_fields = layer_data.get("categorical_fields", {})
        matches = []

        for field_name, field_data in categorical_fields.items():
            field_match = SearchService._search_field(
                workspace,
                layer,
                field_name,
                field_data,
                normalized_query
            )

            if field_match:
                matches.append(field_match)

        return matches

    @staticmethod
    def _search_field(
        workspace: str,
        layer: str,
        field_name: str,
        field_data: Dict,
        normalized_query: str
    ) -> Dict | None:

        matched_values = SearchService._find_matching_values(field_data, normalized_query)

        if not matched_values:
            return None

        return {
            "workspace": workspace,
            "layer": layer,
            "field": field_name,
            "values": matched_values,
            "cql_filter": SearchService._generate_cql_filter(field_name, matched_values),
            "match_type": "field_value"
        }

    @staticmethod
    def _find_matching_values(
            field_data: Dict,
            normalized_query: str
        ) -> List[str]:
        matched = []

        for value in field_data["values"]:
            normalized_value = text_normalizer(value)
            if text_similarity(normalized_value, normalized_query):
                matched.append(value)

        return matched

    @staticmethod
    def _generate_cql_filter(
            field_name: str,
            values: List[str]
        ) -> str:
        if len(values) == 1:
            return f"{field_name} = '{values[0]}'"

        str_values = "', '".join(values)
        return f"{field_name} IN ('{str_values}')"
