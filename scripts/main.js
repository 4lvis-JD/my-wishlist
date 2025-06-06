let currentUser = null;
let products = [];
const status = {};

// 🔐 AUTENTICACIÓN
firebase.auth().onAuthStateChanged(user => {
  currentUser = user;

  if (user) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("addForm").style.display = "block";
    document.getElementById("wishlist").style.display = "block";
    document.getElementById("logoutSection").style.display = "block";

    document.getElementById("welcomeMessage").textContent = `👋 Hola, ${user.email}.`;

    loadData();
  } else {
    document.getElementById("auth").style.display = "block";
    document.getElementById("addForm").style.display = "none";
    document.getElementById("wishlist").style.display = "none";
    document.getElementById("logoutSection").style.display = "none";
    document.getElementById("welcomeMessage").textContent = "";
    currentUser = null;
  }
  document.body.setAttribute("data-loading", "false");
});

function logout() {
  firebase.auth().signOut();
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(error => showAuthMessage(error.message));
}

function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .catch(error => showAuthMessage(error.message));
}

function showAuthMessage(msg) {
  document.getElementById("authMessage").textContent = msg;
}

// 🔗 RUTAS POR USUARIO
function getUserRef(path) {
  return firebase.database().ref(`users/${currentUser.uid}/${path}`);
}

// 📥 CARGAR DATOS
function loadData() {
  getUserRef("wishlistProducts").on("value", snapshot => {
    const data = snapshot.val();
    products = Array.isArray(data) ? data : Object.values(data || {});

    getUserRef("wishlistStatus").once("value").then(statusSnap => {
      if (statusSnap.exists()) {
        Object.assign(status, statusSnap.val());
      }
      loadWishlist();
    });
  });
}

// 💾 GUARDAR DATOS
function saveProducts() {
  if (!currentUser) return;
  getUserRef("wishlistProducts").set(products);
  getUserRef("wishlistStatus").set(status);
}

// 🧩 FUNCIONES UI
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
  saveProducts();

  const card = document.querySelector(`#check-${id}`).closest(".card");
  card.classList.toggle("purchased", checked);
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
    products[index] = { ...products[index], name, price, image, link };
    saveProducts();
    loadWishlist();
  }
}

// ➕ AGREGAR NUEVO PRODUCTO
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

  if (currentUser) {
    products.push(newProduct);
    saveProducts();
    loadWishlist();
    document.getElementById("addForm").reset();
  }
});

// 🗑️ ELIMINAR PRODUCTO
function deleteProduct(id) {
  products = products.filter(p => p.id !== id);
  delete status[id];
  saveProducts();
  loadWishlist();
}