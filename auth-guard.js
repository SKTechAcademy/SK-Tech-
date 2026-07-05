/**
 * auth-guard.js
 * Simple client-side role protection for admin/candidate pages.
 */
(function() {
  const body = document.body;
  const requiredAttr = body.getAttribute("data-required-role") || "";
  const requiredRoles = requiredAttr.split(",").map(function(r) { return r.trim(); }).filter(Boolean);
  const userRole = localStorage.getItem("userRole");

  if (!userRole) {
    window.location.replace("login.html");
    return;
  }

  if (requiredRoles.length > 0 && requiredRoles.indexOf(userRole) === -1) {
    if (userRole === "admin") {
      window.location.replace("admin.html");
    } else if (userRole === "candidate") {
      window.location.replace("candidate.html");
    } else {
      localStorage.clear();
      window.location.replace("login.html");
    }
    return;
  }

  // Optional: expose current user info for page scripts
  window.__currentUser = {
    role: userRole,
    registerId: localStorage.getItem("registerId") || "",
    email: localStorage.getItem("email") || ""
  };
})();
