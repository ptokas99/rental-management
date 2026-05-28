const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9mgvaYaI-tjGuCvitY_Zke5468sQCqVlFiRUZjpyvlxYe3WTLKJDfv7SlOcxElfD-pQ/exec";

let tenants = [];

async function saveTenant() {
  const aadharFile = document.getElementById("aadharDocument").files[0];
  const rentAgreementFile = document.getElementById("rentAgreementDocument").files[0];
  const policeFile = document.getElementById("policeVerificationDocument").files[0];

  console.log("Aadhar file:", aadharFile);
console.log("Rent Agreement file:", rentAgreementFile);
console.log("Police file:", policeFile);

  const maxSize = 2 * 1024 * 1024; // 2 MB

if (aadharFile && aadharFile.size > maxSize) {
  alert("Aadhar file must be less than 2 MB");
  return;
}

if (rentAgreementFile && rentAgreementFile.size > maxSize) {
  alert("Rent Agreement file must be less than 2 MB");
  return;
}

if (policeFile && policeFile.size > maxSize) {
  alert("Police Verification file must be less than 2 MB");
  return;
}

  const tenant = {
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
    policeType: policeFile ? policeFile.type : ""
  };

  tenants.push(tenant);
  renderTenants();

  await sendToGoogleSheets(tenant);

  clearForm();
}

function renderTenants() {
  const list = document.getElementById("tenantList");
  list.innerHTML = "";

  tenants.forEach((tenant) => {
    list.innerHTML += `
      <div class="tenant">
        <h3>${tenant.tenant}</h3>
        <p><strong>Property:</strong> ${tenant.property}</p>
        <p><strong>Flat No:</strong> ${tenant.flatNo}</p>
        <p><strong>Rent:</strong> ₹${tenant.rent}</p>
        <p><strong>Advance:</strong> ₹${tenant.advance}</p>
        <p><strong>Security:</strong> ₹${tenant.security}</p>
        <p><strong>Water:</strong> ₹${tenant.water}</p>
        <p><strong>Maintenance:</strong> ₹${tenant.maintenance}</p>
        <p><strong>Electricity:</strong> ${tenant.electricityType}</p>
        ${
          tenant.electricityUnitCharge
            ? `<p><strong>Electricity Unit Charge:</strong> ₹${tenant.electricityUnitCharge}</p>`
            : ""
        }
        <p><strong>Rent Agreement Due Date:</strong> ${tenant.rentAgreementDueDate || "Not added"}</p>
        <p><strong>Aadhar:</strong> ${tenant.aadharName || "Not uploaded"}</p>
        <p><strong>Rent Agreement:</strong> ${tenant.rentAgreementName || "Not uploaded"}</p>
        <p><strong>Police Verification:</strong> ${tenant.policeName || "Not uploaded"}</p>
      </div>
    `;
  });
}

function clearForm() {
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
  document.getElementById("aadharDocument").value = "";
  document.getElementById("rentAgreementDocument").value = "";
  document.getElementById("policeVerificationDocument").value = "";

  toggleElectricityUnit();
}

async function sendToGoogleSheets(tenant) {
  console.log("Sending tenant to Google Sheets", tenant);

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(tenant)
    });

    console.log("Saved successfully");
  } catch (error) {
    console.log("Error:", error);
  }
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = function () {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
