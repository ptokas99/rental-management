const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9mgvaYaI-tjGuCvitY_Zke5468sQCqVlFiRUZjpyvlxYe3WTLKJDfv7SlOcxElfD-pQ/exec";

let tenants = [];

function saveTenant() {

  const tenant = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    property: document.getElementById("property").value,
    unit: document.getElementById("unit").value,
    rent: document.getElementById("rent").value,
    agreementEnd: document.getElementById("agreementEnd").value
  };

  tenants.push(tenant);

  renderTenants();

  sendToGoogleSheets(tenant);

  clearForm();
}

function renderTenants() {

  const list = document.getElementById("tenantList");

  list.innerHTML = "";

  tenants.forEach((tenant) => {

    list.innerHTML += `
      <div class="tenant">
        <h3>${tenant.name}</h3>
        <p>${tenant.property} - ${tenant.unit}</p>
        <p>Rent: ₹${tenant.rent}</p>
        <p>Agreement End: ${tenant.agreementEnd}</p>
      </div>
    `;
  });
}

function clearForm() {

  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("property").value = "";
  document.getElementById("unit").value = "";
  document.getElementById("rent").value = "";
  document.getElementById("agreementEnd").value = "";
}

async function sendToGoogleSheets(tenant) {

  console.log("Sending tenant to Google Sheets");

  try {

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tenant)
    });

    console.log("Saved successfully");

  } catch(error) {

    console.log("Error:", error);
  }
}