import json
import os
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client("s3")
BUCKET = os.environ["BUCKET_NAME"]
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")


def _cors():
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
    }


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {**{"Content-Type": "application/json"}, **_cors()},
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    # Soporte preflight CORS
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return response(200, {"ok": True})

    path = event.get("rawPath") or event.get("path") or "/"
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")

    try:
        if method == "GET" and path.endswith("/api/files"):
            return list_files(event)
        if method == "GET" and path.endswith("/api/stats"):
            return get_stats()
        return response(404, {"error": "not found", "path": path})
    except ClientError as e:
        return response(500, {"error": str(e)})


def list_files(event):
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
    })


def get_stats():
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
    })


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
