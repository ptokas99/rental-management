const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9mgvaYaI-tjGuCvitY_Zke5468sQCqVlFiRUZjpyvlxYe3WTLKJDfv7SlOcxElfD-pQ/exec";

let tenants = [];

window.onload = function () {
  resetActionView();
  loadDashboard();
};

async function saveTenant() {
  const property = document.getElementById("property").value;

  if (!property) {
    alert("Please select a property before adding a tenant.");
    return;
  }
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
    mobile: document.getElementById("mobile").value,
    tenantType: document.getElementById("tenantType").value,
    rent: document.getElementById("rent").value,
    rentDueDay: document.getElementById("rentDueDay").value,
    advance: document.getElementById("advance").value || 0,
    security: document.getElementById("security").value || 0,
    water: document.getElementById("water").value || 0,
    maintenance: document.getElementById("maintenance").value || 0,
    electricityType: document.getElementById("electricityType").value,
    electricityUnitCharge: document.getElementById("electricityUnitCharge").value || "",
    electricityCaNumber: document.getElementById("electricityCaNumber").value.trim(),
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
        <p><strong>Rent Due:</strong> ${tenant.rentDueDay ? tenant.rentDueDay + getDaySuffix(tenant.rentDueDay) + " of every month" : "Not set"}</p>
        <p><strong>Onboarded:</strong> ${calculateOnboardedDate(tenant.rentAgreementDueDate)}</p>
        <p><strong>Agreement Due:</strong> ${tenant.rentAgreementDueDate || "N/A"}</p>
        <p><strong>Mobile:</strong> ${tenant.mobile || "N/A"}</p>
        <p><strong>Tenant Type:</strong> ${tenant.tenantType || "Residential"}</p>

        <div class="message-status">

  <div>
    👋 <strong>Welcome:</strong>
    ${formatWhatsAppStatus(
      tenant.messageStatus?.tenant_onboarding
    )}
  </div>

  <div>
    🔔 <strong>Rent:</strong>
    ${formatWhatsAppStatus(
      tenant.messageStatus?.rent_due_reminder
    )}
  </div>

  <div>
    ⚡ <strong>Electricity:</strong>
    ${formatWhatsAppStatus(
      tenant.messageStatus?.electricity_bill_reminder
    )}
  </div>

</div>

        <div class="action-buttons">

          ${actionButton}

          <button
            class="reminder-btn"
            onclick="activateRentReminder('${tenant.id}')">
            🔔 Send Reminder
          </button>

          <button
            class="paid-btn"
            onclick="stopRentReminder('${tenant.id}')">
            ✓ Mark Paid
          </button>

          <button
            class="agreement-btn"
            onclick="generateAgreement('${tenant.id}')">
            Generate Agreement
          </button>

          <button
            class="welcome-btn"
            onclick="sendOnboardingMessage('${tenant.id}')">
            👋 Send Welcome Message
          </button>

        </div>
      </div>
    `;
  });
}

function calculateOnboardedDate(dueDate) {
  if (!dueDate) return "N/A";

  const date = new Date(dueDate);
  date.setMonth(date.getMonth() - 11);

  return date.toLocaleDateString("en-IN");
}

function editTenant(id) {
  const tenant = tenants.find(t => String(t.id) === String(id));

  console.log("TENANT RECEIVED FOR EDIT:", tenant);

  document.getElementById("tenantId").value = tenant.id;
  document.getElementById("property").value = tenant.property;
  document.getElementById("flatNo").value = tenant.flatNo;
  document.getElementById("tenant").value = tenant.tenant;
  document.getElementById("mobile").value = tenant.mobile || "";
  document.getElementById("tenantType").value = tenant.tenantType || "Residential";
  document.getElementById("rent").value = tenant.rent;
  document.getElementById("rentDueDay").value = tenant.rentDueDay || "";
  document.getElementById("advance").value = tenant.advance || 0;
  document.getElementById("security").value = tenant.security || 0;
  document.getElementById("water").value = tenant.water || 0;
  document.getElementById("maintenance").value = tenant.maintenance || 0;
  document.getElementById("electricityType").value = tenant.electricityType || "Paid by tenant directly";
  document.getElementById("electricityCaNumber").value = tenant.electricityCaNumber || "";
  document.getElementById("electricityUnitCharge").value = tenant.electricityUnitCharge || "";
  document.getElementById("rentAgreementDueDate").value = tenant.rentAgreementDueDate || "";
  document.getElementById("tenantFormCard").style.display = "block";
  document.getElementById("tenantListCard").style.display = "none";
  document.getElementById("property").disabled = true;
  document.getElementById("formTitle").innerText = "Edit Tenant";

  document.getElementById("formTitle").innerText = "Edit Tenant";
  updateDocumentStatus(tenant);
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
  document.getElementById("rentDueDay").value = "";
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
  document.getElementById("documentStatusBox").style.display = "none";
  document.getElementById("tenantType").value = "Residential";
  document.getElementById("electricityCaNumber").value = "";

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
    if (!tenant.tenant || !tenant.property) return;

    const property = tenant.property;

    const rent = Number(tenant.rent) || 0;
    const water = Number(tenant.water) || 0;
    const maintenance = Number(tenant.maintenance) || 0;

    const monthlyCollection = rent + water + maintenance;

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
    propertyTotals[property].totalRent += rent;
    propertyTotals[property].totalWater += water;
    propertyTotals[property].totalMaintenance += maintenance;
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

  const tenant = tenants.find(t => String(t.id) === String(id));

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

  let businessUse = "";

  if (tenant.tenantType === "Commercial") {
    businessUse = prompt(
      "Enter Business Use Number:\n\n" +
      "1. Office\n" +
      "2. Consultancy Office\n" +
      "3. Retail Shop\n" +
      "4. Boutique\n" +
      "5. Medical Clinic\n" +
      "6. Dental Clinic\n" +
      "7. Salon & Spa\n" +
      "8. Restaurant / Café\n" +
      "9. Warehouse\n" +
      "10. Coaching Institute\n" +
      "11. Pharmacy\n" +
      "12. Electronics Store\n" +
      "13. Other"
    );
  
    const businessOptions = {
      "1": "Office",
      "2": "Consultancy Office",
      "3": "Retail Shop",
      "4": "Boutique",
      "5": "Medical Clinic",
      "6": "Dental Clinic",
      "7": "Salon & Spa",
      "8": "Restaurant / Café",
      "9": "Warehouse",
      "10": "Coaching Institute",
      "11": "Pharmacy",
      "12": "Electronics Store"
    };
  
    if (businessUse === "13") {
      businessUse = prompt("Enter custom business use:");
    } else {
      businessUse = businessOptions[businessUse];
    }
  
    if (!businessUse) {
      alert("Business use is required for commercial agreement.");
      return;
    }
  }

  console.log("Tenant type:", tenant.tenantType);
  console.log("Business Use:", businessUse);

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
    fixtures: fixtures || "",
    businessUse: businessUse
  });

  alert("Rent agreement generated. Please refresh tenants after a few seconds.");

  const selectedProperty = document.getElementById("selectedProperty").value;

  if (selectedProperty) {
    loadTenantsByProperty(selectedProperty);
  }
}

function updateDocumentStatus(tenant) {
  document.getElementById("documentStatusBox").style.display = "block";

  setDocumentStatus(
    "aadharStatus",
    "Aadhar",
    tenant.aadharLink
  );

  setDocumentStatus(
    "rentAgreementStatus",
    "Rent Agreement",
    tenant.rentAgreementLink
  );

  setDocumentStatus(
    "policeStatus",
    "Police Verification",
    tenant.policeVerificationLink
  );
}

function setDocumentStatus(elementId, label, link) {
  const element = document.getElementById(elementId);

  if (link) {
    element.innerHTML = `${label}: Present ✅`;
    element.className = "doc-status doc-present";
  } else {
    element.innerHTML = `${label}: Missing ❌`;
    element.className = "doc-status doc-missing";
  }
}

function getDaySuffix(day) {
  const n = Number(day);

  if (n >= 11 && n <= 13) {
    return "th";
  }

  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

async function activateRentReminder(id) {
  const tenant = tenants.find(
    t => String(t.id) === String(id)
  );

  if (!tenant) {
    alert("Tenant not found.");
    return;
  }

  await sendToGoogleSheets({
    action: "setRentStatus",
    id: tenant.id,
    tenant: tenant.tenant,
    property: tenant.property,
    flatNo: tenant.flatNo,
    status: "Not Paid"
  });

  alert(
    "Reminder activated for " +
    tenant.tenant +
    " for the current month."
  );
}

async function stopRentReminder(id) {
  const tenant = tenants.find(
    t => String(t.id) === String(id)
  );

  if (!tenant) {
    alert("Tenant not found.");
    return;
  }

  await sendToGoogleSheets({
    action: "setRentStatus",
    id: tenant.id,
    tenant: tenant.tenant,
    property: tenant.property,
    flatNo: tenant.flatNo,
    status: "Paid"
  });

  alert(
    tenant.tenant +
    " marked as paid for the current month. Reminders stopped."
  );
}

async function sendOnboardingMessage(id) {
  const tenant = tenants.find(
    t => String(t.id) === String(id)
  );

  if (!tenant) {
    alert("Tenant not found.");
    return;
  }

  const confirmed = confirm(
    "Send welcome message to " +
    tenant.tenant +
    "?"
  );

  if (!confirmed) {
    return;
  }

  await sendToGoogleSheets({
    action: "sendOnboardingMessage",
    id: tenant.id,
    tenant: tenant.tenant,
    property: tenant.property,
    flatNo: tenant.flatNo,
    mobile: tenant.mobile
  });

  alert(
    "Welcome message sent to " +
    tenant.tenant +
    "."
  );
}

function formatWhatsAppStatus(status) {
  const value =
    String(status || "").toLowerCase();

  switch (value) {
    case "api accepted":
      return "Accepted";

    case "sent":
      return "Sent ✓";

    case "delivered":
      return "Delivered ✓✓";

    case "read":
      return "Read ✓✓";

    case "failed":
      return "Failed ❌";

    default:
      return "Not sent";
  }
}
