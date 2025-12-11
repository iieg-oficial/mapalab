from typing import  Dict, Any


def api_responses(*status_codes: int) -> Dict[int, Dict[str, Any]]:
    responses = {}

    response_templates = {
        400: {
            "description": "Bad Request",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid request parameters"}
                }
            }
        },
        404: {
            "description": "Not Found",
            "content": {
                "application/json": {
                    "example": {"detail": "Resource not found"}
                }
            }
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {"detail": "Internal server error"}
                }
            }
        }
    }

    for code in status_codes:
        if code in response_templates:
            responses[code] = response_templates[code]

    return responses
