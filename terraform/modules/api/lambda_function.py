import json
import os
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client("s3")
BUCKET = os.environ["BUCKET_NAME"]
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")


def _cors(origin=None):
    """Devuelve encabezados CORS. Refleja el Origin de la petición si está permitido."""
    if origin == ALLOWED_ORIGIN:
        ao = origin
    else:
        ao = ALLOWED_ORIGIN
    return {
        "Access-Control-Allow-Origin": ao,
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Vary": "Origin",
    }


def response(status_code, body, origin=None):
    return {
        "statusCode": status_code,
        "headers": {**{"Content-Type": "application/json"}, **_cors(origin)},
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    # Extraer el Origin de la petición para reflejarlo en CORS
    headers = event.get("headers", {}) or {}
    origin = headers.get("origin") or headers.get("Origin") or ""

    # Soporte preflight CORS
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return response(200, {"ok": True}, origin=origin)

    path = event.get("rawPath") or event.get("path") or "/"
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")

    try:
        if method == "GET" and path.endswith("/api/files"):
            return list_files(event, origin=origin)
        if method == "GET" and path.endswith("/api/stats"):
            return get_stats(origin=origin)
        if method == "POST" and path.endswith("/api/upload/url"):
            return request_upload_url(event, origin=origin)
        if method == "POST" and path.endswith("/api/upload/complete"):
            return upload_completed(event, origin=origin)
        return response(404, {"error": "not found", "path": path}, origin=origin)
    except ClientError as e:
        return response(500, {"error": str(e)}, origin=origin)


def list_files(event, origin=""):
    params = event.get("queryStringParameters") or {}
    prefix = params.get("prefix", "")
    marker = params.get("marker")
    limit = min(int(params.get("limit") or 20), 100)

    kwargs = {
        "Bucket": BUCKET,
        "MaxKeys": limit,
    }
    if prefix:
        kwargs["Prefix"] = prefix
    if marker:
        kwargs["StartAfter"] = marker

    result = s3.list_objects_v2(**kwargs)

    files = []
    for obj in result.get("Contents", []):
        size = obj.get("Size", 0)
        key = obj["Key"]
        files.append({
            "id": key,
            "key": key,
            "name": key.split("/")[-1] or key,
            "bucket": BUCKET,
            "size": size,
            "type": _content_type(key),
            "lastModified": obj["LastModified"].isoformat(),
            "status": "available",
            "etag": obj.get("ETag", "").strip('"'),
        })

    next_marker = result.get("NextContinuationToken")
    return response(200, {
        "items": files,
        "pagination": {
            "page": 1,
            "pageSize": limit,
            "total": result.get("KeyCount", len(files)),
            "totalPages": 1,
            "nextMarker": next_marker,
            "hasMore": result.get("IsTruncated", False),
        },
    }, origin=origin)


def get_stats(origin=""):
    total_size = 0
    total_files = 0
    continuation_token = None

    while True:
        kwargs = {"Bucket": BUCKET}
        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token
        result = s3.list_objects_v2(**kwargs)
        for obj in result.get("Contents", []):
            total_files += 1
            total_size += obj.get("Size", 0)
        if not result.get("IsTruncated"):
            break
        continuation_token = result["NextContinuationToken"]

    used = int(total_size * 0.34)
    return response(200, {
        "totalFiles": total_files,
        "totalSizeBytes": total_size,
        "usedSizeBytes": used,
        "availableSizeBytes": total_size - used,
        "filesByType": [
            {"type": "Imágenes", "count": max(1, total_files // 3), "size": 0},
            {"type": "Documentos", "count": max(1, total_files // 3), "size": 0},
            {"type": "Otros", "count": max(1, total_files // 3), "size": 0},
        ],
        "recentUploads": 0,
        "pendingUploads": 0,
        "failedUploads": 0,
    }, origin=origin)


def _content_type(key):
    ext = key.rsplit(".", 1)[-1].lower() if "." in key else ""
    mapping = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
        "gif": "image/gif", "svg": "image/svg+xml", "webp": "image/webp",
        "pdf": "application/pdf", "mp4": "video/mp4", "mp3": "audio/mpeg",
        "json": "application/json", "txt": "text/plain", "md": "text/markdown",
        "zip": "application/zip",
    }
    return mapping.get(ext, "application/octet-stream")


def request_upload_url(event, origin=""):
    """Genera una URL prefijada para PUT directo a S3 (sin credenciales en el navegador)."""
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return response(400, {"error": "body JSON invalido"}, origin=origin)

    file_name = body.get("fileName", "archivo")
    content_type = body.get("contentType", "application/octet-stream")
    # Clave única bajo la carpeta de cargas
    import time
    object_key = f"cargas/{int(time.time()*1000)}-{file_name.replace(' ', '_')}"

    try:
        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={"Bucket": BUCKET, "Key": object_key, "ContentType": content_type},
            ExpiresIn=900,  # 15 minutos
        )
    except ClientError as e:
        return response(500, {"error": str(e)}, origin=origin)

    return response(200, {
        "uploadUrl": upload_url,
        "objectKey": object_key,
    }, origin=origin)


def upload_completed(event, origin=""):
    """Notifica que una carga se completo (registro opcional para auditoria)."""
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return response(400, {"error": "body JSON invalido"}, origin=origin)

    object_key = body.get("objectKey")
    if not object_key:
        return response(400, {"error": "objectKey requerido"}, origin=origin)

    # Aquí podría escribirse en DynamoDB o notificar a CloudFront para invalidar cache.
    return response(200, {"ok": True, "objectKey": object_key}, origin=origin)
