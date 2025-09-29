/**
 * ok ts is so old
 */

const projectPath = "technonyte00/vapor";
const glApi = `https://gitlab.com/api/v4/projects/${encodeURIComponent(
  projectPath
)}/repository/commits`;

async function fetchcommit() {
  try {
    const response = await fetch(glApi);
    if (!response.ok) {
      throw new Error("Failed to fetch commits");
    }
    const commits = await response.json();
    const commitId = commits[0]?.id || "c0mm1t-";
    document.getElementById("commit-id").textContent = commitId.substring(0, 7);
  } catch (error) {
    console.error("Error fetching commits:", error);
    document.getElementById("commit-id").textContent = "c0mm1t-";
  }
}

fetchcommit();
