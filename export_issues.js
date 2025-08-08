require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

// Configuration
const baseUrl = process.env.SONARQUBE_URL || "http://localhost:9000"; // Replace with your SonarQube server URL
const token = process.env.SONARQUBE_TOKEN || ""; // Replace with your token
const projectKey = process.env.SONARQUBE_PROJECT_KEY || ""; // Replace with your project key
const outputHtml = "sonarqube_issues.html";

// Axios instance with authentication
const api = axios.create({
  baseURL: baseUrl,
  auth: {
    username: token,
    password: "",
  },
});
// Fetch issues with pagination
async function fetchIssues() {
  let issues = [];
  let page = 1;
  const pageSize = 500; // Max per API request

  while (true) {
    try {
      const response = await api.get("/api/issues/search", {
        params: {
          componentKeys: projectKey,
          ps: pageSize,
          p: page,
        },
      });

      const data = response.data;
      issues = issues.concat(data.issues);
      const total = data.paging.total;
      console.log(`Fetched ${issues.length} of ${total} issues...`);

      if (page * pageSize >= total || !data.issues.length) {
        break;
      }
      page++;
    } catch (error) {
      const errMsg = error.response ? error.response.data : error.message;
      if (error.response && error.response.status === 401) {
        console.error("API request failed (401 Unauthorized):", errMsg);
        console.error("Possible causes:");
        console.error(
          "- Invalid or expired token. Generate a new token in SonarQube: User > My Account > Security."
        );
        console.error(
          '- Insufficient permissions. Ensure the user has "Browse" and "See Issues" permissions for the project.'
        );
        console.error(
          "- Incorrect baseUrl. Verify SonarQube is running at",
          baseUrl
        );
      } else {
        console.error("API request failed:", errMsg);
      }
      process.exit(1);
    }
  }

  return issues;
}

// Generate HTML content
function generateHtml(issues) {
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const data = issues.map((issue) => ({
    key: issue.key,
    file: (issue.component || "N/A").split(':').pop(),
    line: issue.line || "N/A",
    message: escapeHtml(issue.message),
    severity: issue.severity,
    status: issue.status,
    type: issue.type,
  }));

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SonarQube Issues Report</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css" rel="stylesheet">
      <link href="https://cdn.datatables.net/responsive/2.5.0/css/responsive.bootstrap5.min.css" rel="stylesheet">
      <style>
        body {
          padding: 0;
          margin: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .content-wrapper {
          flex: 1;
          padding: 1rem;
        }
        .table-container {
          margin-top: 1rem;
        }
        .severity-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }
        .severity-BLOCKER {
          background-color: #dc3545;
          color: white;
        }
        .severity-CRITICAL {
          background-color: #fd7e14;
          color: white;
        }
        .severity-MAJOR {
          background-color: #ffc107;
          color: black;
        }
        .severity-MINOR {
          background-color: #0dcaf0;
          color: black;
        }
        .severity-INFO {
          background-color: #6c757d;
          color: white;
        }
        .type-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }
        .type-BUG {
          background-color: #dc3545;
          color: white;
        }
        .type-VULNERABILITY {
          background-color: #fd7e14;
          color: white;
        }
        .type-CODE_SMELL {
          background-color: #0dcaf0;
          color: black;
        }
      </style>
    </head>
    <body class="bg-light">
      <div class="content-wrapper">
        <div class="container-fluid">
          <h1 class="h3 mb-3">SonarQube Issues Report</h1>
          
          <div class="card">
            <div class="card-header">
              <div class="row align-items-center">
                <div class="col-md-8">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <select id="severity-filter" class="form-select">
                        <option value="">All Severities</option>
                        <option value="BLOCKER">Blocker</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="MAJOR">Major</option>
                        <option value="MINOR">Minor</option>
                        <option value="INFO">Info</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <select id="type-filter" class="form-select">
                        <option value="">All Types</option>
                        <option value="BUG">Bug</option>
                        <option value="VULNERABILITY">Vulnerability</option>
                        <option value="CODE_SMELL">Code Smell</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table id="issues-table" class="table table-striped table-hover dt-responsive nowrap" style="width:100%">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Message</th>
                      <th>File</th>
                      <th>Line</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.map(row => {
                        const severity = `<span class="severity-badge severity-${row.severity}">${row.severity}</span>`;
                        const type = `<span class="type-badge type-${row.type}">${row.type}</span>`;
                        const copyButton = `<button class="btn btn-sm btn-outline-primary" onclick="navigator.clipboard.writeText('${escapeHtml(row.file)}')" title="Copy file path">Copy Path</button>`;
                        
                        return `
                          <tr>
                            <td>${severity}</td>
                            <td>${escapeHtml(row.status)}</td>
                            <td>${type}</td>
                            <td>${row.message}</td>
                            <td>${escapeHtml(row.file)}</td>
                            <td>${row.line}</td>
                            <td>${copyButton}</td>
                          </tr>
                        `;
                      }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
      <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
      <script src="https://cdn.datatables.net/responsive/2.5.0/js/dataTables.responsive.min.js"></script>
      <script src="https://cdn.datatables.net/responsive/2.5.0/js/responsive.bootstrap5.min.js"></script>
      <script>
        $(document).ready(function() {
          // Initialize DataTable
          const table = $('#issues-table').DataTable({
            responsive: true,
            pageLength: 25,
            order: [[0, 'desc']], // Sort by severity by default
            dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
            language: {
              search: "Search issues:"
            }
          });

          // Custom filtering function
          $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            const severityFilter = $('#severity-filter').val();
            const typeFilter = $('#type-filter').val();
            const severity = data[0]; // Severity column
            const type = data[2]; // Type column

            if ((severityFilter === '' || severity.includes(severityFilter)) &&
                (typeFilter === '' || type.includes(typeFilter))) {
              return true;
            }
            return false;
          });

          // Apply filters when changed
          $('#severity-filter, #type-filter').on('change', function() {
            table.draw();
          });
        });
      </script>
    </body>
    </html>
  `;
}

// Process and export issues
async function exportIssues() {
  let issues = await fetchIssues();
  // Filter out issues with status 'CLOSED'
  issues = issues.filter(issue => issue.status !== 'CLOSED');

  if (!issues.length) {
    console.log(
      "No issues found for the project. Check the project key or run a new analysis."
    );
    return;
  }

  // Export to HTML
  const htmlContent = generateHtml(issues);
  fs.writeFileSync(outputHtml, htmlContent, "utf8");
  console.log(`Exported ${issues.length} issues to ${outputHtml}`);
}

// Run the script
exportIssues().catch(console.error);
