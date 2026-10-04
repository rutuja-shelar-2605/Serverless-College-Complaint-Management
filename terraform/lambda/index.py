import json
import uuid
import boto3
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("college-complaints")


def lambda_handler(event, context):

    method = event.get("requestContext", {}).get("http", {}).get("method", "POST")

    # Submit Complaint
    if method == "POST":

        body = event.get("body") or "{}"

        if isinstance(body, str):
            body = json.loads(body)

        complaint_id = "C" + uuid.uuid4().hex[:8].upper()

        item = {
            "complaint_id": complaint_id,
            "category": body.get("category", "General"),
            "description": body.get("description", ""),
            "status": "Pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        table.put_item(Item=item)

        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "message": "Complaint submitted successfully",
                "complaint_id": complaint_id,
                "status": "Pending"
            })
        }
# Update Complaint Status
    if method == "PUT":

        complaint_id = event.get("pathParameters", {}).get("complaint_id")

        if not complaint_id:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "message": "Complaint ID is required"
                })
            }

        body = event.get("body") or "{}"

        if isinstance(body, str):
            body = json.loads(body)

        new_status = body.get("status")

        if new_status not in ["Pending", "In Progress", "Resolved"]:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "message": "Invalid status"
                })
            }

        response = table.update_item(
            Key={
                "complaint_id": complaint_id
            },
            UpdateExpression="SET #status = :status",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": new_status
            },
            ReturnValues="ALL_NEW"
        )

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "message": "Complaint status updated successfully",
                "complaint": response["Attributes"]
            })
        }

    # Track Complaint
    if method == "GET":

        complaint_id = event.get("pathParameters", {}).get("complaint_id")

        if not complaint_id:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "message": "Complaint ID is required"
                })
            }

        response = table.get_item(
            Key={
                "complaint_id": complaint_id
            }
        )

        item = response.get("Item")

        if not item:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "message": "Complaint not found"
                })
            }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(item)
        }

    return {
        "statusCode": 405,
        "body": json.dumps({
            "message": "Method not allowed"
        })
    }