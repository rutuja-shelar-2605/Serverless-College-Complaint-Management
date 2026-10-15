\# CASAS — Serverless College Complaint Management System



\## Project Overview



CASAS is a cloud-based college complaint management system that allows students to submit complaints and track their status. The administration dashboard helps staff view complaints, search records, filter by category or status, and update complaint statuses.



\## Objectives



\- Provide an online complaint submission form.

\- Generate a unique Complaint ID for tracking.

\- Store complaint records in Amazon DynamoDB.

\- Process API requests using AWS Lambda and Amazon API Gateway.

\- Provision AWS infrastructure using Terraform.

\- Provide an administration dashboard for complaint management.



\## Technology Stack



\- \*\*Frontend:\*\* HTML, CSS, JavaScript

\- \*\*Cloud Provider:\*\* Amazon Web Services (AWS)

\- \*\*API:\*\* Amazon API Gateway HTTP API

\- \*\*Compute:\*\* AWS Lambda with Python

\- \*\*Database:\*\* Amazon DynamoDB

\- \*\*Infrastructure as Code:\*\* Terraform

\- \*\*Version Control:\*\* Git and GitHub



\## Project Structure



```text

Serverless-College-Complaint-Management/

├── frontend/

│   ├── assets/

│   │   ├── casas-bg.jpeg

│   │   └── casas-logo.png

│   ├── index.html

│   ├── style.css

│   ├── script.js

│   ├── admin.html

│   ├── admin.css

│   ├── admin.js

│   └── README.txt

└── terraform/

&#x20;   ├── main.tf

&#x20;   ├── .terraform.lock.hcl

&#x20;   └── lambda/

&#x20;       ├── index.py

&#x20;       └── main.tf

```



\## Main Features



\### Student Portal

\- Submit a complaint with the required details.

\- Receive a Complaint ID after successful submission.

\- Track a complaint using its Complaint ID.



\### Administration Dashboard

\- View complaint records.

\- Search complaints.

\- Filter by complaint status and category.

\- Refresh complaint data.

\- Update status to Pending, In Progress, or Resolved.



\## AWS Architecture



1\. The student uses the web form to submit a complaint.

2\. Amazon API Gateway receives the HTTP request.

3\. AWS Lambda validates and processes the request.

4\. Amazon DynamoDB stores complaint information.

5\. The tracking endpoint retrieves a complaint by its ID.

6\. The administration dashboard retrieves complaint records and sends status updates through the API.



\## Deployment and Testing



The AWS infrastructure is defined using Terraform.



Before deployment, configure AWS credentials securely and review the Terraform plan. Use `terraform validate` to check the Terraform configuration.



The student portal and administration dashboard have been tested for complaint submission, complaint tracking, listing, searching, filtering, refreshing, and status updates.



\## Security Notes



This project is an academic prototype. Before real departmental use, implement and verify administrator authentication, API authorization, server-side validation, restricted data access, and appropriate CORS settings.



Do not commit AWS credentials, secrets, Terraform state files, or private configuration files to GitHub.



\## Future Enhancements



\- Add secure staff login and role-based authorization.

\- Improve complaint validation and error handling.

\- Add pagination and reporting.

\- Deploy the frontend to an appropriate HTTPS hosting service.

\- Add audit logs and notifications.



\## Repository



\[CASAS — Serverless College Complaint Management System](https://github.com/rutuja-shelar-2605/Serverless-College-Complaint-Management)



