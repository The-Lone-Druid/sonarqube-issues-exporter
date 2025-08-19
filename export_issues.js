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

  // Calculate metrics
  const metrics = {
    total: issues.length,
    severities: {
      BLOCKER: issues.filter(i => i.severity === 'BLOCKER').length,
      CRITICAL: issues.filter(i => i.severity === 'CRITICAL').length,
      MAJOR: issues.filter(i => i.severity === 'MAJOR').length,
      MINOR: issues.filter(i => i.severity === 'MINOR').length,
      INFO: issues.filter(i => i.severity === 'INFO').length,
    },
    types: {
      BUG: issues.filter(i => i.type === 'BUG').length,
      VULNERABILITY: issues.filter(i => i.type === 'VULNERABILITY').length,
      CODE_SMELL: issues.filter(i => i.type === 'CODE_SMELL').length,
    },
    statuses: {
      OPEN: issues.filter(i => i.status === 'OPEN').length,
      CONFIRMED: issues.filter(i => i.status === 'CONFIRMED').length,
      RESOLVED: issues.filter(i => i.status === 'RESOLVED').length,
      REOPENED: issues.filter(i => i.status === 'REOPENED').length,
    }
  };

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
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
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
        .border-left-primary {
          border-left: 0.25rem solid #4e73df !important;
        }
        .border-left-danger {
          border-left: 0.25rem solid #e74a3b !important;
        }
        .border-left-warning {
          border-left: 0.25rem solid #f6c23e !important;
        }
        .border-left-info {
          border-left: 0.25rem solid #36b9cc !important;
        }
        .text-gray-800 {
          color: #5a5c69 !important;
        }
        .text-gray-300 {
          color: #dddfeb !important;
        }
        .shadow {
          box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15) !important;
        }
        .btn-link:hover {
          text-decoration: none !important;
        }
        .btn-link .fas.fa-chevron-down {
          transition: transform 0.3s ease-in-out;
        }
        .btn-link[aria-expanded="true"] .fas.fa-chevron-down {
          transform: rotate(180deg);
        }
        .btn-link:focus {
          box-shadow: none;
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
          <h1 class="h3 mb-4">SonarQube Issues Report</h1>
          
          <!-- Collapsible Metrics Overview -->
          <div class="card mb-4">
            <div class="card-header">
              <button class="btn btn-link text-decoration-none p-0 w-100 text-start" type="button" data-bs-toggle="collapse" data-bs-target="#metricsCollapse" aria-expanded="false" aria-controls="metricsCollapse">
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="mb-0 text-primary">
                    <i class="fas fa-chart-bar me-2"></i>
                    Issues Metrics Overview
                  </h5>
                  <i class="fas fa-chevron-down"></i>
                </div>
              </button>
            </div>
            <div class="collapse" id="metricsCollapse">
              <div class="card-body">
                <!-- Metrics Overview -->
                <div class="row mb-4">
            <div class="col-xl-3 col-md-6 mb-3">
              <div class="card border-left-primary shadow h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Issues</div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">${metrics.total}</div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-bug fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-xl-3 col-md-6 mb-3">
              <div class="card border-left-danger shadow h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">Critical Issues</div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">${metrics.severities.BLOCKER + metrics.severities.CRITICAL}</div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-xl-3 col-md-6 mb-3">
              <div class="card border-left-warning shadow h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Bugs</div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">${metrics.types.BUG}</div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-times-circle fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-xl-3 col-md-6 mb-3">
              <div class="card border-left-info shadow h-100">
                <div class="card-body">
                  <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                      <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Vulnerabilities</div>
                      <div class="h5 mb-0 font-weight-bold text-gray-800">${metrics.types.VULNERABILITY}</div>
                    </div>
                    <div class="col-auto">
                      <i class="fas fa-shield-alt fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Detailed Metrics -->
          <div class="row mb-4">
            <div class="col-lg-6 mb-3">
              <div class="card shadow">
                <div class="card-header py-3">
                  <h6 class="m-0 font-weight-bold text-primary">Issues by Severity</h6>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-sm-6">
                      <div class="mb-2">
                        <span class="severity-badge severity-BLOCKER">BLOCKER</span>
                        <span class="float-end fw-bold">${metrics.severities.BLOCKER}</span>
                      </div>
                      <div class="mb-2">
                        <span class="severity-badge severity-CRITICAL">CRITICAL</span>
                        <span class="float-end fw-bold">${metrics.severities.CRITICAL}</span>
                      </div>
                      <div class="mb-2">
                        <span class="severity-badge severity-MAJOR">MAJOR</span>
                        <span class="float-end fw-bold">${metrics.severities.MAJOR}</span>
                      </div>
                    </div>
                    <div class="col-sm-6">
                      <div class="mb-2">
                        <span class="severity-badge severity-MINOR">MINOR</span>
                        <span class="float-end fw-bold">${metrics.severities.MINOR}</span>
                      </div>
                      <div class="mb-2">
                        <span class="severity-badge severity-INFO">INFO</span>
                        <span class="float-end fw-bold">${metrics.severities.INFO}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-lg-6 mb-3">
              <div class="card shadow">
                <div class="card-header py-3">
                  <h6 class="m-0 font-weight-bold text-primary">Issues by Type & Status</h6>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-sm-6">
                      <h6 class="text-secondary">By Type</h6>
                      <div class="mb-2">
                        <span class="type-badge type-BUG">BUG</span>
                        <span class="float-end fw-bold">${metrics.types.BUG}</span>
                      </div>
                      <div class="mb-2">
                        <span class="type-badge type-VULNERABILITY">VULNERABILITY</span>
                        <span class="float-end fw-bold">${metrics.types.VULNERABILITY}</span>
                      </div>
                      <div class="mb-2">
                        <span class="type-badge type-CODE_SMELL">CODE_SMELL</span>
                        <span class="float-end fw-bold">${metrics.types.CODE_SMELL}</span>
                      </div>
                    </div>
                    <div class="col-sm-6">
                      <h6 class="text-secondary">By Status</h6>
                      <div class="mb-2">
                        <span class="badge bg-danger">OPEN</span>
                        <span class="float-end fw-bold">${metrics.statuses.OPEN}</span>
                      </div>
                      <div class="mb-2">
                        <span class="badge bg-warning">CONFIRMED</span>
                        <span class="float-end fw-bold">${metrics.statuses.CONFIRMED}</span>
                      </div>
                      <div class="mb-2">
                        <span class="badge bg-success">RESOLVED</span>
                        <span class="float-end fw-bold">${metrics.statuses.RESOLVED}</span>
                      </div>
                      <div class="mb-2">
                        <span class="badge bg-info">REOPENED</span>
                        <span class="float-end fw-bold">${metrics.statuses.REOPENED}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
                </div>
              </div>
            </div>
          </div>
          
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
