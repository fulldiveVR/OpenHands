from fastapi.staticfiles import StaticFiles
from starlette.responses import Response, HTMLResponse
from starlette.types import Scope


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            return await super().get_response(path, scope)
        except Exception:
            # FIXME: just making this HTTPException doesn't work for some reason
            try:
                return await super().get_response('index.html', scope)
            except Exception:
                # If even index.html fails, return a fallback response to prevent None
                return HTMLResponse(
                    content="<html><body><h1>Frontend build not available</h1></body></html>",
                    status_code=500
                )
