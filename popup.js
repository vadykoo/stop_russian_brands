const brandForm = document.getElementById("brandForm");

// Function to create checkbox element for each brand category
function createCheckbox(name, enabled) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = name;
  checkbox.checked = enabled;

  const label = document.createElement("label");
  label.textContent = name;
  label.appendChild(checkbox);

  brandForm.appendChild(label);

  // Add event listener to toggle brand category and send message to background script
  checkbox.addEventListener("change", () => {
    const toggleData = {
      name,
      enabled: checkbox.checked,
    };
    chrome.runtime.sendMessage(toggleData, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        console.log(`Brand category '${name}' toggled: ${checkbox.checked}`);
      }
    });
  });
}

// Fetch brandData from local storage and create checkboxes
chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
  if (!brandData) {
    brandData = defaultBrandData; // Use default brand data if not found in local storage
  }

  brandData.forEach(({ name, enabled }) => {
    createCheckbox(name, enabled);
  });
});

// Send a message to the background script when the popup is opened
document.addEventListener("DOMContentLoaded", () => {
    // Update the list of custom brands in the popup
  function updateCustomBrandsList(customBrands) {
    const customBrandsUl = document.getElementById("customBrandsUl");
    customBrandsUl.innerHTML = ""; // Clear the existing list

    customBrands.forEach((customBrand) => {
      const listItem = document.createElement("li");
      listItem.textContent = customBrand.name;
      customBrandsUl.appendChild(listItem);
    });
  }

  chrome.runtime.sendMessage({ action: "fetchBrandData" });



    // Add event listener to update the list of custom brands
    const addCustomBrandButton = document.getElementById("addCustomBrandButton");
    addCustomBrandButton.addEventListener("click", () => {
      const customBrandInput = document.getElementById("customBrandInput");
      const customBrand = customBrandInput.value.trim();
      if (customBrand) {
        chrome.runtime.sendMessage(
          { action: "addCustomBrand", brand: customBrand.toLowerCase() },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
            } else {
              console.log(`Custom brand '${customBrand}' added`);
              customBrandInput.value = "";
  
              // Update the list of custom brands
              chrome.storage.local.get({ customBrands: [] }, ({ customBrands }) => {
                updateCustomBrandsList(customBrands);
              });
            }
          }
        );
      }
    });
  
    chrome.storage.local.get({ customBrands: [] }, ({ customBrands }) => {
      updateCustomBrandsList(customBrands);
    });


    //search
  const searchInput = document.getElementById("brandSearch");
  const searchResults = document.getElementById("searchResults");

  searchInput.addEventListener("input", function () {
    const searchTerm = searchInput.value.toLowerCase();

    // Clear previous search results
    searchResults.innerHTML = "";

    if (searchTerm.trim() === "") {
      return; // Exit if the search term is empty
    }

    chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
      if (!brandData) {
        brandData = defaultBrandData; // Use default brand data if not found in local storage
      }

      // Iterate through brandData and find matches
      const matchingBrands = [];
      for (const category of brandData) {
        if (category.names) {
          for (const brand of category.names) {
            // Ensure brand.names is defined before iterating
            if (brand.names) {
              for (const brandName of brand.names) {
                // Ensure brandName is defined before accessing its properties
                const currentBrandName = (brandName || '').toLowerCase();

                if (currentBrandName.includes(searchTerm)) {
                  matchingBrands.push(brand);
                  if (matchingBrands.length >= 5) {
                    break; // Stop iterating if we have 5 matches
                  }
                  break; // Exit the brand.names loop if a match is found
                }
              }
            }
          }
        }
      }

      // Display the first 5 matching brands in the popup
      for (let i = 0; i < Math.min(5, matchingBrands.length); i++) {
        const brand = matchingBrands[i];
        const brandElement = document.createElement("div");
        brandElement.textContent = brand.names[0] || ''; // Use the first name if available

        // Display description or link if available
        if (brand.description) {
          const descriptionElement = document.createElement("p");
          descriptionElement.textContent = brand.description;
          brandElement.appendChild(descriptionElement);
        } else if (brand.linkSource) {
          const linkElement = document.createElement("a");
          linkElement.href = brand.linkSource;
          linkElement.target = "_blank";
          linkElement.textContent = "Learn more";
          brandElement.appendChild(linkElement);
        }

        searchResults.appendChild(brandElement);
      }
    });
  });
    //search
});

const fetchBrandDataButton = document.getElementById("fetchBrandDataButton");
const brandCount = document.getElementById("brandCount");

fetchBrandDataButton.addEventListener("click", () => {
  chrome.storage.local.remove("brandData", function () {
    console.log(
      "brandData has been removed from local storage and updated from GitHub",
    );
  });

  chrome.runtime.sendMessage({ action: "fetchBrandData" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    } else {
      // Force fetch the brand data again and update the brand count
      chrome.storage.local.set({ fetchTime: null }, () => {
        brandCount.textContent = `Number of brands on server: ${response.brandCount}`;
      });
    }
  });
});

chrome.storage.local.get(
  { brandData: null, fetchTime: null },
  ({ brandData, fetchTime }) => {
    if (brandData) {
      const totalBrandsElement = document.getElementById("totalBrands");
      const lastUpdatedElement = document.getElementById("lastUpdated");

      // Calculate the total number of brands
      let totalBrands = 0;
      brandData.forEach((category) => {
        totalBrands += category.names.length;
      });

      document.getElementById("totalBrands").textContent = totalBrands;

      if (fetchTime) {
        const lastUpdatedDate = new Date(fetchTime);
        lastUpdatedElement.textContent = `Last updated: ${lastUpdatedDate.toLocaleString()}`;
      }
    }
  },
);

const toggleExtensionButton = document.getElementById("toggleExtension");

function updateToggleButton() {
  chrome.storage.local.get(
    { extensionEnabled: true },
    ({ extensionEnabled }) => {
      toggleExtensionButton.textContent = extensionEnabled ? "ON" : "OFF";
    },
  );
}

toggleExtensionButton.addEventListener("click", () => {
  chrome.storage.local.get(
    { extensionEnabled: true },
    ({ extensionEnabled }) => {
      // Toggle the extensionEnabled value
      chrome.storage.local.set({ extensionEnabled: !extensionEnabled }, () => {
        console.log(`Extension toggled: ${!extensionEnabled}`);
        updateToggleButton();
      });
    },
  );
});

// Update the button text when the popup is opened
updateToggleButton();