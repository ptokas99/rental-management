const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9mgvaYaI-tjGuCvitY_Zke5468sQCqVlFiRUZjpyvlxYe3WTLKJDfv7SlOcxElfD-pQ/exec";

let tenants = [];

window.onload = function () {
  resetActionView();
  loadDashboard();
};

async function saveTenant() {
  const tenantId = document.getElementById("tenantId").value;

  const aadharFile = document.getElementById("aadharDocument").files[0];
  const rentAgreementFile = document.getElementById("rentAgreementDocument").files[0];
  const policeFile = document.getElementById("policeVerificationDocument").files[0];

  const tenant = {
    action: tenantId ? "edit" : "add",
    id: tenantId,

    property: document.getElementById("property").value,
    flatNo: document.getElementById("flatNo").value,
    tenant: document.getElementById("tenant").value,
    rent: document.getElementById("rent").value,
    advance: document.getElementById("advance").value || 0,
    security: document.getElementById("security").value || 0,
    water: document.getElementById("water").value || 0,
    maintenance: document.getElementById("maintenance").value || 0,
    electricityType: document.getElementById("electricityType").value,
    electricityUnitCharge: document.getElementById("electricityUnitCharge").value || "",
    rentAgreementDueDate: document.getElementById("rentAgreementDueDate").value,

    aadharBase64: await fileToBase64(aadharFile),
    aadharName: aadharFile ? aadharFile.name : "",
    aadharType: aadharFile ? aadharFile.type : "",

    rentAgreementBase64: await fileToBase64(rentAgreementFile),
    rentAgreementName: rentAgreementFile ? rentAgreementFile.name : "",
    rentAgreementType: rentAgreementFile ? rentAgreementFile.type : "",

    policeBase64: await fileToBase64(policeFile),
    policeName: policeFile ? policeFile.name : "",
    policeType: policeFile ? policeFile.type : "",

    removeAadhar: document.getElementById("removeAadhar").checked,
    removeRentAgreement: document.getElementById("removeRentAgreement").checked,
    removePoliceVerification: document.getElementById("removePoliceVerification").checked
  };

  console.log("Saving tenant with files:", tenant);

  await sendToGoogleSheets(tenant);

  clearForm();

  const selectedProperty = document.getElementById("selectedProperty").value;

  if (selectedProperty) {
    loadTenantsByProperty(selectedProperty);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = function () {
      resolve(reader.result.split(",")[1]);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadTenantsByProperty(property) {
  const response = await fetch(GOOGLE_SCRIPT_URL);
  const allTenants = await response.json();

  tenants = allTenants.filter(t => t.property === property);

  renderTenants();
}

function renderTenants() {
  const list = document.getElementById("tenantList");
  list.innerHTML = "";

  if (tenants.length === 0) {
    list.innerHTML = "<p>No tenants found for this property.</p>";
    return;
  }

  tenants.forEach((tenant) => {
    let actionButton = "";

    if (currentAction === "edit") {
      actionButton = `
        <button class="edit-btn" onclick="editTenant('${tenant.id}')">
          Edit This Tenant
        </button>
      `;
    }

    if (currentAction === "delete") {
      actionButton = `
        <button class="danger" onclick="deleteTenant('${tenant.id}')">
          Delete This Tenant
        </button>
      `;
    }

    list.innerHTML += `
      <div class="tenant">
        <h3>${tenant.tenant}</h3>
        <p><strong>Property:</strong> ${tenant.property}</p>
        <p><strong>Flat No:</strong> ${tenant.flatNo}</p>
        <p><strong>Rent:</strong> ₹${tenant.rent}</p>
        <p><strong>Agreement Due:</strong> ${tenant.rentAgreementDueDate || "N/A"}</p>

        <div class="action-buttons">

          ${actionButton}

          <button
            class="agreement-btn"
            onclick="generateAgreement('${tenant.id}')">
            Generate Agreement
          </button>

        </div>
      </div>
    `;
  });
}

function editTenant(id) {
  const tenant = tenants.find(t => String(t.id) === String(id));

  document.getElementById("tenantId").value = tenant.id;
  document.getElementById("property").value = tenant.property;
  document.getElementById("flatNo").value = tenant.flatNo;
  document.getElementById("tenant").value = tenant.tenant;
  document.getElementById("rent").value = tenant.rent;
  document.getElementById("advance").value = tenant.advance || 0;
  document.getElementById("security").value = tenant.security || 0;
  document.getElementById("water").value = tenant.water || 0;
  document.getElementById("maintenance").value = tenant.maintenance || 0;
  document.getElementById("electricityType").value = tenant.electricityType || "Paid by tenant directly";
  document.getElementById("electricityUnitCharge").value = tenant.electricityUnitCharge || "";
  document.getElementById("rentAgreementDueDate").value = tenant.rentAgreementDueDate || "";
  document.getElementById("tenantFormCard").style.display = "block";
  document.getElementById("tenantListCard").style.display = "none";
  document.getElementById("property").disabled = true;
  document.getElementById("formTitle").innerText = "Edit Tenant";

  document.getElementById("formTitle").innerText = "Edit Tenant";
  toggleElectricityUnit();
  window.scrollTo(0, 0);
}

async function deleteTenant(id) {
  const confirmDelete = confirm("Are you sure you want to delete this tenant?");

  if (!confirmDelete) return;

  await sendToGoogleSheets({
    action: "delete",
    id: id
  });

  const selectedProperty = document.getElementById("selectedProperty").value;

  if (selectedProperty) {
    loadTenantsByProperty(selectedProperty);
  }
}

async function sendToGoogleSheets(data) {
  console.log("Sending to Apps Script:", data);

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(data)
    });

    console.log("Request sent to Apps Script");
  } catch (error) {
    console.log("Fetch error:", error);
  }
}

function clearForm() {
  document.getElementById("tenantId").value = "";
  document.getElementById("property").value = "";
  document.getElementById("flatNo").value = "";
  document.getElementById("tenant").value = "";
  document.getElementById("rent").value = "";
  document.getElementById("advance").value = "0";
  document.getElementById("security").value = "0";
  document.getElementById("water").value = "0";
  document.getElementById("maintenance").value = "0";
  document.getElementById("electricityType").value = "Paid by tenant directly";
  document.getElementById("electricityUnitCharge").value = "";
  document.getElementById("rentAgreementDueDate").value = "";
  document.getElementById("formTitle").innerText = "Add Tenant";
  document.getElementById("property").disabled = false;
  document.getElementById("removeAadhar").checked = false;
  document.getElementById("removeRentAgreement").checked = false;
  document.getElementById("removePoliceVerification").checked = false;

  toggleElectricityUnit();
}

function toggleElectricityUnit() {
  const electricityType = document.getElementById("electricityType").value;
  const unitBox = document.getElementById("electricityUnitBox");
  const unitField = document.getElementById("electricityUnitCharge");

  if (electricityType === "Paid by tenant per unit charge") {
    unitBox.style.display = "block";
  } else {
    unitBox.style.display = "none";
    unitField.value = "";
  }
}

let currentAction = "";

function getSelectedProperty() {
  return document.getElementById("selectedProperty").value;
}

function resetActionView() {
  currentAction = "";
  document.getElementById("tenantFormCard").style.display = "none";
  document.getElementById("tenantListCard").style.display = "none";
  clearForm();
}

function showAddTenantForm() {
  const property = getSelectedProperty();

  if (!property) {
    alert("Please select a property first");
    return;
  }

  currentAction = "add";

  document.getElementById("tenantFormCard").style.display = "block";
  document.getElementById("tenantListCard").style.display = "none";

  clearForm();

  document.getElementById("property").value = property;
  document.getElementById("property").disabled = true;
  document.getElementById("formTitle").innerText = "Add Tenant";
}

function showEditTenants() {
  const property = getSelectedProperty();

  if (!property) {
    alert("Please select a property first");
    return;
  }

  currentAction = "edit";

  document.getElementById("tenantFormCard").style.display = "none";
  document.getElementById("tenantListCard").style.display = "block";
  document.getElementById("tenantListTitle").innerText = "Select Tenant to Edit";

  loadTenantsByProperty(property);
}

function showDeleteTenants() {
  const property = getSelectedProperty();

  if (!property) {
    alert("Please select a property first");
    return;
  }

  currentAction = "delete";

  document.getElementById("tenantFormCard").style.display = "none";
  document.getElementById("tenantListCard").style.display = "block";
  document.getElementById("tenantListTitle").innerText = "Select Tenant to Delete";

  loadTenantsByProperty(property);
}

async function loadDashboard() {
  const response = await fetch(GOOGLE_SCRIPT_URL);
  const allTenants = await response.json();

  const propertyTotals = {};

  allTenants.forEach((tenant) => {

    const property = tenant.property || "Unknown Property";

    const monthlyCollection =
      Number(tenant.rent || 0) +
      Number(tenant.water || 0) +
      Number(tenant.maintenance || 0);

    if (!propertyTotals[property]) {
      propertyTotals[property] = {
        totalCollection: 0,
        totalRent: 0,
        totalWater: 0,
        totalMaintenance: 0,
        tenantCount: 0
      };
    }

    propertyTotals[property].totalCollection += monthlyCollection;
    propertyTotals[property].totalRent += Number(tenant.rent || 0);
    propertyTotals[property].totalWater += Number(tenant.water || 0);
    propertyTotals[property].totalMaintenance += Number(tenant.maintenance || 0);
    propertyTotals[property].tenantCount += 1;
  });

  renderDashboard(propertyTotals);
}

function renderDashboard(propertyTotals) {
  const dashboard = document.getElementById("dashboardList");
  dashboard.innerHTML = "";

  let grandTotal = 0;

  Object.keys(propertyTotals).forEach((property) => {
    grandTotal += propertyTotals[property].totalCollection;
  });

  dashboard.innerHTML = `
    <div class="total-card">
      <h2>Total Monthly Collection</h2>
      <h1>₹${grandTotal.toLocaleString("en-IN")}</h1>
    </div>

    <div class="dashboard-grid">
      ${Object.keys(propertyTotals).map((property) => `
        <div class="property-card">
          <h3>${property}</h3>

          <div class="stat-row">
            <strong>Tenants</strong>
            <span>${propertyTotals[property].tenantCount}</span>
          </div>

          <div class="stat-row">
            <strong>Rent</strong>
            <span>₹${propertyTotals[property].totalRent.toLocaleString("en-IN")}</span>
          </div>

          <div class="stat-row">
            <strong>Water</strong>
            <span>₹${propertyTotals[property].totalWater.toLocaleString("en-IN")}</span>
          </div>

          <div class="stat-row">
            <strong>Maintenance</strong>
            <span>₹${propertyTotals[property].totalMaintenance.toLocaleString("en-IN")}</span>
          </div>

          <div class="collection-badge">
            ₹${propertyTotals[property].totalCollection.toLocaleString("en-IN")} / month
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function generateAgreement(id) {
  const confirmGenerate = confirm("Generate rent agreement for this tenant?");

  if (!confirmGenerate) return;

  const ownerName = prompt("Enter Owner / Lessor Name:");
  if (!ownerName) return;

  const ownerAddress = prompt("Enter Owner / Lessor Address:");
  if (!ownerAddress) return;

  const ownerAadhaar = prompt("Enter Owner Aadhaar:");
  if (!ownerAadhaar) return;

  const tenantAddress = prompt("Enter Tenant / Lessee Address:");
  const tenantAadhaar = prompt("Enter Tenant Aadhaar:");

  const propertyAddress = prompt(
    "Enter complete rented property address:\nExample: J-128, Third Floor Flat No. 303, Mohammad Pur, RK Puram, New Delhi - 110066"
  );
  if (!propertyAddress) return;

  const startDate = prompt("Enter Agreement Start Date:\nExample: 01/01/2026");
  if (!startDate) return;

  const fixtures = prompt(
    "Enter Fixtures & Fittings:\nExample: Geyser, Refrigerator, Almirah\nLeave blank if none."
  );

  await sendToGoogleSheets({
    action: "generateAgreement",
    id: id,
    ownerName: ownerName,
    ownerAddress: ownerAddress,
    ownerAadhaar: ownerAadhaar,
    tenantAddress: tenantAddress || "",
    tenantAadhaar: tenantAadhaar || "",
    propertyAddress: propertyAddress,
    startDate: startDate,
    fixtures: fixtures || ""
  });

  alert("Rent agreement generated. Please refresh tenants after a few seconds.");

  const selectedProperty = document.getElementById("selectedProperty").value;

  if (selectedProperty) {
    loadTenantsByProperty(selectedProperty);
  }
}
