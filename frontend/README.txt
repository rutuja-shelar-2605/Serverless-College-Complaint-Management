# CASAS Department Complaint Portal — Frontend starter

## Files
- `index.html` — portal layout and complaint/track forms
- `style.css` — responsive dark navy, electric blue, violet and teal dashboard theme
- `script.js` — attempts POST submission and GET status lookup using the existing API URL

## Open locally
1. Extract this ZIP.
2. Copy `index.html`, `style.css`, and `script.js` into your existing project's `frontend` folder, replacing those three files.
3. Open the project in VS Code.
4. Right-click `index.html` and choose **Open with Live Server**.

## Current API assumptions
- Base URL: `https://kiqrjrhubl.execute-api.ap-south-1.amazonaws.com`
- Submit: `POST /complaints`
- Track: `GET /complaints/{complaint_id}`
- Request keys sent: `student_name`, `department`, `category`, `location`, `description`
- The frontend looks for a complaint ID in `complaint_id`, `complaintId`, `id`, or `ticket_id`.

These keys/response fields must be checked against the actual Lambda source before relying on the portal. A successful HTTP response without a returned complaint ID is shown as a warning, not represented as fully complete.

## Backend changes needed before real department use
1. **Verify Lambda request schema:** persist `category` and `location` as well as name, department, description, complaint ID, created timestamp, and status. Validate input server-side.
2. **Verify status lookup:** `GET /complaints/{complaint_id}` must return a consistent JSON record and a real 404 for unknown IDs.
3. **Fix/verify status update:** `PUT /complaints/{complaint_id}` must accept only allowed status values (for example `Pending`, `In Progress`, `Resolved`) and return clear errors.
4. **CORS:** configure the HTTP API to allow the actual frontend origin, methods `GET,POST,PUT,OPTIONS`, and header `Content-Type`. For local testing, the Live Server origin will be different from the final hosting origin. Avoid `*` for a production department portal. AWS reference: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html
5. **Secure staff/HOD sign-in:** use Amazon Cognito User Pools and an API Gateway JWT authorizer (or another server-verified auth design). Create staff/HOD groups and enforce role checks in the backend. Do not store passwords or role flags in front-end JavaScript.
6. **Staff dashboard APIs:** add an authenticated endpoint to list complaints (with pagination/filtering) and enforce authorization on status updates. Existing GET-by-ID does not provide a dashboard list.
7. **Privacy:** return only fields needed by the caller; restrict who can view complaint records. Do not publish the site for real student data until authentication, access control, validation and testing are complete.
8. **Live hosting:** hosting is a separate step (for example private/protected distribution or a suitable HTTPS host). Review AWS costs before adding services.

## Important
This is a frontend starter and not yet a verified live system. The form makes real requests to the API URL above, but API compatibility, CORS, security and the returned response format still need to be tested. Staff/HOD login and complaint administration are not enabled by this starter.
