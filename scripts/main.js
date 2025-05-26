let products = [];
const status = {};

firebase.database().ref("wishlistProducts").on("value", snapshot => {
  if (snapshot.exists()) {
    products = snapshot.val();
  } else {
    products = [];
  }

  firebase.database().ref("wishlistStatus").once("value").then(statusSnap => {
    if (statusSnap.exists()) {
      Object.assign(status, statusSnap.val());
    }
    loadWishlist();
  });
});

function saveProducts() {
  firebase.database().ref("wishlistProducts").set(products);
  firebase.database().ref("wishlistStatus").set(status);
}

function loadWishlist() {
  const container = document.getElementById("wishlist");
  container.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "card";
    if (status[product.id]) {
    card.classList.add("purchased");
  }
    card.innerHTML = `
    <div class="card-image">
      <img src="${product.image}" alt="${product.name}" />
    </div>
      <div class="card-content">
        <div class="view-mode">
          <h2>${product.name}</h2>
          <p class="price">${product.price}</p>

          <div class="button-group">
            ${product.link ? `<a href="${product.link}" class="btn btn-primary" target="_blank">Ver producto</a>` : ''}
            <button onclick="editProduct(${product.id})" class="btn btn-blue">Editar</button>
            <button onclick="deleteProduct(${product.id})" class="btn btn-red">Eliminar</button>
          </div>

          <div class="checkbox-group">
            <input type="checkbox" ${status[product.id] ? 'checked' : ''} onchange="togglePurchased(${product.id}, this.checked)" id="check-${product.id}">
            <label for="check-${product.id}">Comprado</label>
          </div>
        </div>

        <div class="edit-mode" style="display: none;">
          <input type="text" value="${product.name}" id="name-${product.id}" />
          <input type="text" value="${product.price}" id="price-${product.id}" />
          <input type="text" value="${product.image}" id="image-${product.id}" />
          <input type="text" value="${product.link}" id="link-${product.id}" />
          <div class="card-actions">
            <div></div>
            <div class="action-buttons">
              <button onclick="saveEdit(${product.id})">Guardar</button>
              <button onclick="cancelEdit(${product.id})">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function togglePurchased(id, checked) {
  status[id] = checked;
  firebase.database().ref("wishlistStatus").set(status);

  const card = document.querySelector(`#check-${id}`).closest(".card");
  if (checked) {
    card.classList.add("purchased");
  } else {
    card.classList.remove("purchased");
  }
}

function editProduct(id) {
  const card = document.querySelector(`#wishlist .card-content:has(input[id='name-${id}'])`);
  card.querySelector(".view-mode").style.display = "none";
  card.querySelector(".edit-mode").style.display = "block";
}

function cancelEdit(id) {
  const card = document.querySelector(`#wishlist .card-content:has(input[id='name-${id}'])`);
  card.querySelector(".edit-mode").style.display = "none";
  card.querySelector(".view-mode").style.display = "block";
}

function saveEdit(id) {
  const name = document.getElementById(`name-${id}`).value;
  const price = document.getElementById(`price-${id}`).value;
  const image = document.getElementById(`image-${id}`).value;
  const link = document.getElementById(`link-${id}`).value;

  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index].name = name;
    products[index].price = price;
    products[index].image = image;
    products[index].link = link;
    saveProducts();
    loadWishlist();
  }
}

// Formulario para agregar nuevos productos
document.getElementById("addForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const image = document.getElementById("image").value;
  const link = document.getElementById("link").value;
  const newProduct = {
    id: Date.now(),
    name,
    price,
    image,
    link,
  };
  products.push(newProduct);
  saveProducts();
  loadWishlist();
  this.reset();
});

loadWishlist();

// Función para eliminar un producto
function deleteProduct(id) {
  products = products.filter(p => p.id !== id);
  delete status[id];
  saveProducts();
  firebase.database().ref("wishlistStatus").set(status);
  loadWishlist();
}